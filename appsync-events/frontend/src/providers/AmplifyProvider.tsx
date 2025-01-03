'use client'

import { PropsWithChildren } from 'react';
import { Amplify, ResourcesConfig } from 'aws-amplify'

import outputs from '@/amplify_outputs.json'
Amplify.configure(outputs as ResourcesConfig)

export function AmplifyProvider({ children }: PropsWithChildren) {
    return <>{children}</>;
  }