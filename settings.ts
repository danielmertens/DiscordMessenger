import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { WebhookModal } from './webhook-modal';

export interface WebhookConfig {
	name: string;
	webhook: string;
	activatedDate?: string; // Store date as YYYY-MM-DD string
}

export interface MyPluginSettings {
	mySetting: string;
	webhooks: WebhookConfig[];
}

// Plugin interface for type safety
interface IMyPlugin extends Plugin {
	settings: MyPluginSettings;
	saveSettings(): Promise<void>;
	loadSettings(): Promise<void>;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	webhooks: []
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: IMyPlugin;

	constructor(app: App, plugin: IMyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					await this.updateSetting('mySetting', value);
				}));

		// Discord Webhooks section
		const activeWebhook = this.getActiveWebhook();
		const description = activeWebhook 
			? `Configure your Discord webhooks here. Currently active: ${activeWebhook.name}`
			: 'Configure your Discord webhooks here. No webhook is currently active.';

		const webhookSetting = new Setting(containerEl)
			.setName('Discord Webhooks')
			.setDesc(description)
			.addButton(button => {
				button
					.setButtonText('Add Webhook')
					.onClick(() => {
						// Open modal for adding webhook
						new WebhookModal(this.app, async (webhook) => {
							await this.addWebhook(webhook);
						}).open();
					});
			});

		// Create webhook table
		this.createWebhookTable(containerEl);
	}

	// Method to update a single setting
	private async updateSetting(key: keyof MyPluginSettings, value: any): Promise<void> {
		this.plugin.settings[key] = value;
		await this.plugin.saveSettings();
	}

	// Method to add a webhook
	async addWebhook(webhook: WebhookConfig): Promise<void> {
		this.plugin.settings.webhooks.push(webhook);
		await this.plugin.saveSettings();
		this.display(); // Refresh the display
	}

	// Method to remove a webhook
	async removeWebhook(index: number): Promise<void> {
		if (index >= 0 && index < this.plugin.settings.webhooks.length) {
			this.plugin.settings.webhooks.splice(index, 1);
			await this.plugin.saveSettings();
			this.display(); // Refresh the display
		}
	}

	// Method to update a webhook
	async updateWebhook(index: number, webhook: WebhookConfig): Promise<void> {
		if (index >= 0 && index < this.plugin.settings.webhooks.length) {
			this.plugin.settings.webhooks[index] = webhook;
			await this.plugin.saveSettings();
			this.display(); // Refresh the display
		}
	}

	// Method to toggle webhook activation
	async toggleWebhookActivation(index: number): Promise<void> {
		if (index >= 0 && index < this.plugin.settings.webhooks.length) {
			const webhook = this.plugin.settings.webhooks[index];
			const today = this.getCurrentDateString();
			const wasActiveToday = this.isWebhookActiveToday(webhook);

			// First, deactivate all webhooks (clear their activation dates)
			this.plugin.settings.webhooks.forEach(w => w.activatedDate = undefined);

			// If the webhook wasn't active today, activate it for today
			if (!wasActiveToday) {
				webhook.activatedDate = today;
			}

			await this.plugin.saveSettings();
			this.display(); // Refresh the display
		}
	}

	// Method to get the currently active webhook
	getActiveWebhook(): WebhookConfig | null {
		const today = this.getCurrentDateString();
		return this.plugin.settings.webhooks.find(w => w.activatedDate === today) || null;
	}

	// Helper method to get current date as YYYY-MM-DD string
	private getCurrentDateString(): string {
		const now = new Date();
		return now.toISOString().split('T')[0]; // Get YYYY-MM-DD format
	}

	// Helper method to check if a webhook is active today
	private isWebhookActiveToday(webhook: WebhookConfig): boolean {
		const today = this.getCurrentDateString();
		return webhook.activatedDate === today;
	}

	private createWebhookTable(containerEl: HTMLElement): void {
		// Create table container
		const tableContainer = containerEl.createDiv('webhook-table-container');
		
		if (this.plugin.settings.webhooks.length === 0) {
			tableContainer.createEl('p', { text: 'No webhooks configured yet.' });
			return;
		}

		// Create table
		const table = tableContainer.createEl('table', { cls: 'webhook-table' });
		
		// Create header
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { text: 'Name' });
		headerRow.createEl('th', { text: 'Webhook URL' });
		headerRow.createEl('th', { text: 'Actions' });

		// Create body
		const tbody = table.createEl('tbody');
		
		this.plugin.settings.webhooks.forEach((webhook: WebhookConfig, index: number) => {
			const row = tbody.createEl('tr');
			
			// Add active styling if this webhook is active today
			if (this.isWebhookActiveToday(webhook)) {
				row.addClass('webhook-row-active');
			}
			
			// Name cell
			row.createEl('td', { text: webhook.name });
			
			// Webhook URL cell (truncated for display)
			const urlCell = row.createEl('td');
			const truncatedUrl = webhook.webhook.length > 50 
				? webhook.webhook.substring(0, 50) + '...' 
				: webhook.webhook;
			urlCell.createEl('span', { 
				text: truncatedUrl,
				attr: { title: webhook.webhook } // Show full URL on hover
			});
			
			// Actions cell
			const actionsCell = row.createEl('td');
			actionsCell.style.display = 'flex';
			actionsCell.style.gap = '4px';
			actionsCell.style.justifyContent = 'center';
			actionsCell.style.alignItems = 'center';
			actionsCell.style.whiteSpace = 'nowrap';
			
			// Activate/Deactivate button
			const isActiveToday = this.isWebhookActiveToday(webhook);
			const activateButton = actionsCell.createEl('button', { 
				text: isActiveToday ? 'Deactivate' : 'Activate',
				cls: isActiveToday ? 'mod-warning' : 'mod-cta'
			});
			
			activateButton.onclick = async () => {
				await this.toggleWebhookActivation(index);
			};
			
			// Edit button
			const editButton = actionsCell.createEl('button', { 
				text: 'Edit',
				cls: 'mod-secondary'
			});
			
			editButton.onclick = async () => {
				// Open edit modal
				new WebhookModal(
					this.app, 
					async (updatedWebhook) => {
						await this.updateWebhook(index, updatedWebhook);
					},
					webhook, // Pass existing webhook data
					index    // Pass index for reference
				).open();
			};
			
			// Delete button
			const deleteButton = actionsCell.createEl('button', { 
				text: 'Delete',
				cls: 'mod-destructive'
			});
			
			deleteButton.onclick = async () => {
				// Remove webhook using the class method
				await this.removeWebhook(index);
			};
		});
	}
}
