import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useIdentity } from '@/context/IdentityContext';
import { api, useBottle } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { Composer } from '@/components/Composer';

export default function ReplyScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const { token, refreshIdentity } = useIdentity();
  const { data: bottle } = useBottle(token, bottleId ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!token || !bottleId || sending) return;
    setSending(true);
    try {
      await api.replyToBottle(token, bottleId, text.trim());
      await refreshIdentity();
      router.replace('/reply-sent');
    } catch (e: unknown) {
      showAlert('It did not send', e instanceof Error ? e.message : 'Could not send the reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Composer
      title="Write back"
      placeholder="Write back to them..."
      value={text}
      onChangeText={setText}
      onSubmit={send}
      submitLabel="Send it back"
      submitting={sending}
      onBack={() => router.back()}
      quote={bottle?.text ?? null}
      hasTabBar={false}
    />
  );
}
