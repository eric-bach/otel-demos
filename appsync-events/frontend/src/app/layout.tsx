import { AmplifyProvider } from '@/providers/AmplifyProvider'

import './globals.css'

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body>
				<AmplifyProvider>
					{children}
				</AmplifyProvider>
			</body>
		</html>
	)
}