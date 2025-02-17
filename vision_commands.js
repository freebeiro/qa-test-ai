import { VisionEnhancedCommand } from './commands.js';

export class TestVisionCommand extends VisionEnhancedCommand {
    constructor(browserTab) {
        super(browserTab);
        console.log('🔍 Creating TestVisionCommand');
    }

    async execute() {
        try {
            console.log('📸 Capturing screenshot for vision test...');
            const screenshot = await this.browserTab.captureScreenshot();
            
            const base64Image = screenshot.replace(/^data:image\/\w+;base64,/, '');
            
            console.log('🔍 Running vision analysis...');
            const analysis = await this.visionService.analyzeScreenshot(base64Image);
            
            console.log('📊 Vision analysis results:', analysis);
            
            return {
                success: true,
                message: 'Vision analysis completed',
                screenshots: [{
                    data: screenshot,
                    caption: 'Analyzed Page'
                }],
                analysis: this.formatResults(analysis)
            };
        } catch (error) {
            console.error('❌ Vision test failed:', error);
            throw error;
        }
    }

    formatResults(analysis) {
        let formatted = 'Vision Analysis Results:\n\n';

        if (analysis.elements?.length > 0) {
            formatted += '📍 Interactive Elements Found:\n';
            analysis.elements.forEach(el => {
                formatted += `• ${el.type}: ${el.description}\n`;
            });
            formatted += '\n';
        }

        if (analysis.suggestions?.length > 0) {
            formatted += '💡 Suggested Actions:\n';
            analysis.suggestions.forEach(suggestion => {
                formatted += `• ${suggestion}\n`;
            });
            formatted += '\n';
        }

        if (analysis.text) {
            formatted += '📝 Detailed Analysis:\n';
            formatted += analysis.text;
        }

        return formatted;
    }
}
