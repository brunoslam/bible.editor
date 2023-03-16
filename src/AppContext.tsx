import React, { createContext, useReducer } from 'react';

import { reducer, initialState as reducerInitialState } from './reducers';

import {
  type IUser,
  type RoleType,
  type StateType as GlobalStateType,
  type FeedbackType,
} from './reducers/global.reducer';

import { useGlobal } from './hooks/useGlobal';

export interface ContextType {
  states: {
    global: GlobalStateType;
  };
  actions: {
    setUser: (user: IUser) => void;
    setRole: (role: RoleType) => void;
    alertFeedback: (feedbackType: FeedbackType, message: string) => void;
    closeFeedback: () => void;
  };
}

export const AppContext = createContext<ContextType | undefined>(undefined);

interface AppProviderProps {
  children?: React.ReactNode;
}

export function AppContextProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(reducer, reducerInitialState);

  const { alertFeedback, closeFeedback, setRole, setUser } = useGlobal({
    dispatch,
  });
  const value = {
    states: { global: state.global },
    actions: { closeFeedback, alertFeedback, setRole, setUser },
  };

  console.log(value);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
