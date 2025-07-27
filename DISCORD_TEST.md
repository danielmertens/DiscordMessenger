# Discord Message Test

Here's how the new Discord message blocks work with the markdown post processor:

```discord
🎉 **Welcome to our Discord server!**

This message block now has:
- Custom Discord styling with blue border
- A "Send" button to post directly to Discord
- Webhook status indicator
- Interactive functionality
```

You can also send formatted messages:

```discord
📢 **Important Announcement**

Hello @everyone! 

🔥 New features available:
- Markdown formatting support
- Emoji support 🚀
- Direct sending from Obsidian

Let us know what you think! 💭
```

And simple messages too:

```discord
Quick update: The meeting has been moved to 3 PM.
```

## Features:

1. **Visual Styling**: Discord-branded blue theme
2. **Send Button**: Always enabled - click to send directly to your active webhook
3. **Smart Notifications**: Helpful messages when no webhook is configured
4. **Real-time Feedback**: Button shows "Sending..." and "Sent!" states
5. **Error Handling**: Displays notices for success/failure
6. **Daily Reset**: Webhook activations automatically reset each day for security

## Usage:

1. Configure a webhook in the plugin settings
2. Activate the webhook you want to use (valid for today only)
3. Write your message in a `discord` code block
4. Click the "Send" button to post to Discord!

**Note**: 
- If no webhook is active, clicking "Send" will show a helpful notice directing you to the settings.
- Webhook activations automatically reset daily - you'll need to reactivate your preferred webhook each day.
- Only one webhook can be active per day.
