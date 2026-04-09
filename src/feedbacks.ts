export default function GetFeedbacks(self: any) {
	const feedbacks: any = {}

	feedbacks['test_feedback'] = {
		type: 'boolean',
		name: 'LUKE TEST FEEDBACK',
		description: 'Always true',
		defaultStyle: {
			bgcolor: 16711680,
			color: 16777215,
		},
		options: [],
		callback: () => true,
	}

	feedbacks['input_mute_state'] = {
		type: 'boolean',
		name: 'Input mute state',
		description: 'True when the selected input is muted',
		defaultStyle: {
			bgcolor: 16711680,
			color: 16777215,
		},
		options: [
			{
				type: 'dropdown',
				label: self.CHOICES_INPUT_CHANNEL.name,
				id: 'channel',
				default: 1 + self.CHOICES_INPUT_CHANNEL.offset,
				choices: self.CHOICES_INPUT_CHANNEL.values,
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback: any) => {
			const ch = parseInt(feedback.options.channel) + 1
			return self.getVariableValue(`input_${ch}_mute`) === '1'
		},
	}

	return feedbacks
}