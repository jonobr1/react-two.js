import { createContext, useContext } from 'react';
import Two from 'two.js';
import type { Group } from 'two.js/src/group';

export const Context = createContext<{
  two: Two | null;
  parent: Group | null;
}>({ two: null, parent: null });
export const useTwo = () => useContext(Context);
