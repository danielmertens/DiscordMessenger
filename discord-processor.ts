import { Notice } from 'obsidian';
import MyPlugin from './main';

export class DiscordMessageProcessor {
    private plugin: MyPlugin;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
    }

    // Process discord code blocks
    processDiscordBlock(element: HTMLElement, content: string): void {
        // Clear the original content
        element.empty();

        // Create the discord message block container
        const discordBlock = element.createDiv('discord-message-block');

        // Create header with title and send button
        const header = discordBlock.createDiv('discord-message-header');
        
        const title = header.createSpan();
        title.textContent = 'Discord Message';

        const rightSection = header.createDiv();
        rightSection.style.display = 'flex';
        rightSection.style.alignItems = 'center';

        // Create send button
        const sendButton = rightSection.createEl('button', {
            cls: 'discord-send-button',
            text: 'Send'
        });

        // Create content area
        const contentDiv = discordBlock.createDiv('discord-message-content');
        contentDiv.textContent = content;

        // Add click handler for send button
        sendButton.onclick = async () => {
            await this.sendToDiscord(content, sendButton);
        };
    }

    private async sendToDiscord(content: string, button: HTMLButtonElement): Promise<void> {
        const activeWebhook = this.plugin.getActiveWebhook();
        
        if (!activeWebhook) {
            new Notice('No active webhook configured! Please go to settings and activate a webhook.');
            return;
        }

        // Disable button and show loading state
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Sending...';

        try {
            // Send to Discord webhook
            const response = await fetch(activeWebhook.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    username: 'Obsidian',
                    avatar_url: 'https://obsidian.md/images/obsidian-logo-gradient.svg'
                })
            });

            if (response.ok) {
                new Notice('Message sent to Discord successfully!');
                button.textContent = 'Sent!';
                button.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.backgroundColor = '';
                }, 2000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to send Discord message:', error);
            new Notice('Failed to send message to Discord!');
            
            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        }
    }
}
