import { App, Modal, Notice, Setting } from 'obsidian';
import { WebhookConfig } from './settings';

export class WebhookModal extends Modal {
	private nameValue: string = '';
	private webhookValue: string = '';
	private onSubmit: (webhook: WebhookConfig) => Promise<void>;
	private isEditMode: boolean = false;
	private editIndex?: number;

	constructor(
		app: App, 
		onSubmit: (webhook: WebhookConfig) => Promise<void>,
		existingWebhook?: WebhookConfig,
		editIndex?: number
	) {
		super(app);
		this.onSubmit = onSubmit;
		
		if (existingWebhook) {
			this.nameValue = existingWebhook.name;
			this.webhookValue = existingWebhook.webhook;
			this.isEditMode = true;
			this.editIndex = editIndex;
		}
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl('h2', { 
			text: this.isEditMode ? 'Edit Discord Webhook' : 'Add Discord Webhook' 
		});

		// Name input
		new Setting(contentEl)
			.setName('Name')
			.setDesc('Enter a name for this webhook (e.g., "General Channel")')
			.addText(text => text
				.setPlaceholder('Enter webhook name')
				.setValue(this.nameValue)
				.onChange(value => {
					this.nameValue = value;
				}));

		// Webhook URL input
		new Setting(contentEl)
			.setName('Webhook URL')
			.setDesc('Enter the Discord webhook URL')
			.addText(text => text
				.setPlaceholder('https://discord.com/api/webhooks/...')
				.setValue(this.webhookValue)
				.onChange(value => {
					this.webhookValue = value;
				}));

		// Buttons container
		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.onclick = () => {
			this.close();
		};

		// Add/Update button
		const submitButton = buttonContainer.createEl('button', { 
			text: this.isEditMode ? 'Update Webhook' : 'Add Webhook',
			cls: 'mod-cta'  // Obsidian's primary button style
		});
		submitButton.onclick = async () => {
			await this.handleSubmit();
		};

		// Handle Enter key to submit
		contentEl.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				this.handleSubmit();
			}
		});
	}

	private async handleSubmit() {
		// Validate inputs
		if (!this.nameValue.trim()) {
			new Notice('Please enter a name for the webhook');
			return;
		}

		if (!this.webhookValue.trim()) {
			new Notice('Please enter a webhook URL');
			return;
		}

		// Basic URL validation
		if (!this.isValidWebhookUrl(this.webhookValue)) {
			new Notice('Please enter a valid Discord webhook URL');
			return;
		}

		try {
			// Create webhook config
			const webhook: WebhookConfig = {
				name: this.nameValue.trim(),
				webhook: this.webhookValue.trim()
			};

			// Call the submit callback
			await this.onSubmit(webhook);
			
			const action = this.isEditMode ? 'updated' : 'added';
			new Notice(`Webhook "${webhook.name}" ${action} successfully!`);
			this.close();
		} catch (error) {
			new Notice('Failed to add webhook. Please try again.');
			console.error('Error adding webhook:', error);
		}
	}

	private isValidWebhookUrl(url: string): boolean {
		try {
			const urlObj = new URL(url);
			// Check if it's a Discord webhook URL
			return urlObj.hostname === 'discord.com' || urlObj.hostname === 'discordapp.com';
		} catch {
			return false;
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
