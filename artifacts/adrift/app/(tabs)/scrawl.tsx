import React from 'react';
import { router } from 'expo-router';
import { useCompose } from '@/context/ComposeContext';
import { Composer } from '@/components/Composer';

export default function WriteScreen() {
  const { text, setText } = useCompose();

  return (
    <Composer
      title="Write"
      placeholder="What do you want the sea to carry?"
      value={text}
      onChangeText={setText}
      onSubmit={() => router.push('/scope')}
      submitLabel="Choose an ocean"
      note="Text only. No photos, no names - just what you'd say to a stranger."
    />
  );
}
