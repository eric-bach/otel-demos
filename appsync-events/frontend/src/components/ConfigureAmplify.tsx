// components/ConfigureAmplify.tsx
'use client'

import { Amplify, ResourcesConfig } from 'aws-amplify'

import outputs from '@/amplify_outputs.json'
Amplify.configure(outputs as ResourcesConfig)

export default function ConfigureAmplifyClientSide() {
	return null
}