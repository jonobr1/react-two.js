import { createContext, useContext } from 'react';
import Two from 'two.js';
import { Element } from 'two.js/src/element';

export const Context = createContext<{
  two: Two | null;
  parent: Element | null;
}>({ two: null, parent: null });
export const useTwo = () => useContext(Context);
