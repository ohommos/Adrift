import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useIdentity } from '@/context/IdentityContext';
import { api, useCorrespondence } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { Composer } from '@/components/Composer';

export default function WriteLetterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, refreshIdentity } = useIdentity();
  const queryClient = useQueryClient();
  const { data } = useCorrespondence(token, id ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!token || !id || sending) return;
    setSending(true);
    try {
      await api.writeLetter(token, id, text.trim());
      await refreshIdentity();
      queryClient.invalidateQueries({ queryKey: ['correspondence', id] });
      queryClient.invalidateQueries({ queryKey: ['correspondences'] });
      router.back();
    } catch (e: unknown) {
      showAlert('It did not sail', e instanceof Error ? e.message : 'Could not send the letter.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Composer
      title={data ? `To ${data.withNickname}` : 'Write back'}
      placeholder="Write back to them..."
      value={text}
      onChangeText={setText}
      onSubmit={send}
      submitLabel="Send it across"
      submitting={sending}
      onBack={() => router.back()}
      hasTabBar={false}
      note="It leaves your shore now. How long it takes depends how far apart you are."
    />
  );
}
