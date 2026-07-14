'use client';

import { makeStore } from '@stores/store';
import { useState } from 'react';
import { Provider } from 'react-redux';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
