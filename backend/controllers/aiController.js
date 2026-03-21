import { pipeline } from '@xenova/transformers';

// Singleton class to load the AI model only once into memory
export class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    // Initialize the AI model
    static async init() {
        if (this.instance === null) {
            console.log("Loading AI model for CV ranking...");
            this.instance = await pipeline(this.task, this.model);
            console.log("AI model loaded successfully!");
        }
    }

    // Get the already loaded model instance
    static async getInstance() {
        if (this.instance === null) {
            await this.init();
        }
        return this.instance;
    }
}


// AI CV Ranking Function
export const rankCVs = async (req, res) => {
    try {
        const { prompt, filteredInterns } = req.body;

        // Validate input data
        if (!filteredInterns || filteredInterns.length === 0) {
            return res.status(200).json({
                ranked_cvs: [],
                message: "No valid CVs to rank."
            });
        }

        if (!prompt) {
            return res.status(400).json({
                message: "Prompt is required."
            });
        }

        // Load AI model
        const extractor = await PipelineSingleton.getInstance();

        // Improve prompt understanding for the AI model
        const optimizedPrompt = `Looking for a candidate with the following skills and experience: ${prompt}`;

        // Convert prompt into embedding
        const promptOutput = await extractor(
            optimizedPrompt.toLowerCase(),
            { pooling: 'mean', normalize: true }
        );

        const promptEmbedding = Array.from(promptOutput.data);

        const scoredInterns = [];

        // Loop through each intern and calculate similarity score
        for (const intern of filteredInterns) {

            let internText = "";

            // Add expected job roles
            if (intern.expected_role) {
                internText += Array.isArray(intern.expected_role)
                    ? intern.expected_role.join(" ") + " "
                    : intern.expected_role + " ";
            }

            // Add skills
            if (intern.skills) {
                internText += typeof intern.skills === 'object'
                    ? Object.values(intern.skills).flat().join(" ") + " "
                    : intern.skills + " ";
            }

            // Add degree
            if (intern.degree) {
                internText += intern.degree + " ";
            }

            // Add university
            if (intern.university) {
                internText += intern.university + " ";
            }

            // Add CV extracted text
            if (intern.cv_extracted_text) {
                internText += intern.cv_extracted_text + " ";
            }

            // If no useful text found
            if (!internText.trim()) {
                intern.similarityScore = 0;
                scoredInterns.push(intern);
                continue;
            }

            // Convert intern CV text into embedding
            const internOutput = await extractor(
                internText.toLowerCase(),
                { pooling: 'mean', normalize: true }
            );

            const internEmbedding = Array.from(internOutput.data);

            // Compute cosine similarity score
            let score = 0;
            const length = Math.min(promptEmbedding.length, internEmbedding.length);

            for (let i = 0; i < length; i++) {
                score += promptEmbedding[i] * internEmbedding[i];
            }

            intern.similarityScore = score;

            // Debug log (optional but useful)
            console.log(
                `${intern.senderName || intern.name || "Candidate"} -> Score: ${score.toFixed(4)}`
            );

            scoredInterns.push(intern);
        }

        // Sort interns by similarity score (highest first)
        scoredInterns.sort((a, b) => b.similarityScore - a.similarityScore);

        // Strong match threshold
        const threshold = 0.40;

        // Filter only strong matches
        let filtered = scoredInterns.filter(i => i.similarityScore >= threshold);

        // If no strong matches found, fallback to top candidates
        if (filtered.length === 0) {
            filtered = scoredInterns.slice(0, 10);
        }

        // Limit results (top 15 only)
        const ranked_cvs = filtered.slice(0, 15).map((intern, index) => ({
            ...intern,
            rank: index + 1
        }));

        return res.status(200).json({ ranked_cvs });

    } catch (error) {
        console.error("Ranking error:", error);

        return res.status(500).json({
            message: "Internal server error during AI ranking",
            error: error.message
        });
    }
};