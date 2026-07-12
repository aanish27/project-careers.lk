'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/actions/auth.actions';

export function LoginForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        {from && <input type="hidden" name="from" value={from} />}
        <Field data-invalid={!!state?.fieldErrors?.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            aria-invalid={!!state?.fieldErrors?.email}
            required
          />
          <FieldError>{state?.fieldErrors?.email}</FieldError>
        </Field>
        <Field data-invalid={!!state?.fieldErrors?.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            aria-invalid={!!state?.fieldErrors?.password}
            required
          />
          <FieldError>{state?.fieldErrors?.password}</FieldError>
        </Field>
        {state?.error && <FieldError>{state.error}</FieldError>}
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Login'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
