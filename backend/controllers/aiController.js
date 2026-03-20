import { pipeline } from '@xenova/transformers';

// AI Model eka eka parak witharak memory ekata load karaganna Singleton class eka
// class PipelineSingleton {
//     static task = 'feature-extraction';
//     static model = 'Xenova/all-MiniLM-L6-v2';
//     static instance = null;

//     static async getInstance() {
//         if (this.instance === null) {
//             console.log("Loading AI Model for the first time... (This may take a few seconds)");
//             this.instance = await pipeline(this.task, this.model);
//             console.log("AI Model loaded successfully!");
//         }
//         return this.instance;
//     }
// }

export class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async init() {
        if (this.instance === null) {
            console.log("Preloading AI model...");
            this.instance = await pipeline(this.task, this.model);
            console.log("AI model ready!");
        }
    }

    static async getInstance() {
        if (this.instance === null) {
            await this.init();
        }
        return this.instance;
    }
}

// AI CV Ranking Function eka
export const rankCVs = async (req, res) => {
    try {
        const { prompt, filteredInterns } = req.body;

        if (!filteredInterns || filteredInterns.length === 0) {
            return res.status(200).json({ ranked_cvs: [], message: "No valid CVs to rank." });
        }

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required." });
        }

        const extractor = await PipelineSingleton.getInstance();
        const promptOutput = await extractor(prompt.toLowerCase(), { pooling: 'mean', normalize: true });
        const promptEmbedding = Array.from(promptOutput.data);

        const scoredInterns = [];

        for (const intern of filteredInterns) {
            let internText = "";
            if (intern.expected_role) internText += (Array.isArray(intern.expected_role) ? intern.expected_role.join(" ") : intern.expected_role) + " ";
            if (intern.skills) internText += (typeof intern.skills === 'object' ? Object.values(intern.skills).flat().join(" ") : intern.skills) + " ";
            if (intern.cv_extracted_text) internText += intern.cv_extracted_text + " ";
            
            if (!internText.trim()) {
                intern.similarityScore = 0;
                scoredInterns.push(intern);
                continue;
            }

            const internOutput = await extractor(internText.toLowerCase(), { pooling: 'mean', normalize: true });
            const internEmbedding = Array.from(internOutput.data);

            let score = 0;
            for (let i = 0; i < promptEmbedding.length; i++) {
                score += promptEmbedding[i] * internEmbedding[i];
            }

            intern.similarityScore = score;
            scoredInterns.push(intern);
        }

        scoredInterns.sort((a, b) => b.similarityScore - a.similarityScore);

        const ranked_cvs = scoredInterns.map((intern, index) => ({
            ...intern,
            rank: index + 1
        }));

        res.status(200).json({ ranked_cvs });

    } catch (error) {
        console.error("Ranking error:", error);
        res.status(500).json({ message: "Internal server error during AI ranking", error: error.message });
    }
};