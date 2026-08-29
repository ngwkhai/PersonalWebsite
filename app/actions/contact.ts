'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { Resend } from 'resend';
import { contactLimit, clientKey } from '@/lib/rate-limit';

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; field?: 'email' | 'message' | 'form' };

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  message: z.string().trim().min(20).max(4000),
  // Honeypot — a real person leaves this empty.
  company: z.string().max(0).optional().or(z.literal('')),
});

export async function sendMessage(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    company: formData.get('company') ?? '',
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === 'company') return { status: 'sent' }; // Bot: pretend it worked.
    return {
      status: 'error',
      field: field === 'email' || field === 'message' ? field : 'form',
    };
  }

  const requestHeaders = await headers();
  if (contactLimit) {
    const { success } = await contactLimit.limit(clientKey(requestHeaders));
    if (!success) return { status: 'error', field: 'form' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  if (!apiKey || !to) {
    console.error('[contact] RESEND_API_KEY or CONTACT_EMAIL is not configured');
    return { status: 'error', field: 'form' };
  }

  const { name, email, message } = parsed.data;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
      to,
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    if (error) throw new Error(error.message);
  } catch (cause) {
    console.error('[contact] send failed', cause);
    return { status: 'error', field: 'form' };
  }

  return { status: 'sent' };
}
