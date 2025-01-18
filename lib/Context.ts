import React, { createContext, useContext } from 'react';
import Two from 'two.js';

export const Context = createContext<React.MutableRefObject<Two | null> | null>(null);
export const useTwo = () => useContext(Context);