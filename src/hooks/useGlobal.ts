import { useRef, type Dispatch, useCallback } from 'react';

import {
  setRole as setRoleAction,
  setUser as setUserAction,
  alertFeedback as alertFeedbackAction,
  closeFeedback as closeFeedbackAction,
  setTranslatedMap as setTranslatedMapAction,
  setPrefersColorScheme as setPrefersColorSchemeAction,
  logout as logoutAction,
} from '@/reducers/global.actions';

import { type ActionType } from '@/reducers/index';
import {
  type FeedbackType,
  type RoleType,
  type IUser,
  type PrefersColorSchemeType,
  TranslatedMap,
} from '@/reducers/global.reducer';

interface UseGlobalProps {
  dispatch: Dispatch<ActionType<unknown>>;
}

// This hook take care every chagnes of discussion's state via connecting graphql servers
export function useGlobal({ dispatch }: UseGlobalProps) {
  const dispatchRef = useRef<{ dispatch: Dispatch<ActionType<unknown>> }>({
    dispatch,
  });

  const setUser = useCallback((user: IUser) => {
    dispatchRef.current.dispatch(setUserAction(user));
  }, []);

  const setRole = useCallback((role: RoleType) => {
    dispatchRef.current.dispatch(setRoleAction(role));
  }, []);

  const setPrefersColorScheme = useCallback(
    (prefers: PrefersColorSchemeType) => {
      dispatchRef.current.dispatch(setPrefersColorSchemeAction(prefers));
    },
    [],
  );

  const alertFeedback = useCallback(
    (feedbackType: FeedbackType, message: string) => {
      dispatchRef.current.dispatch(alertFeedbackAction(feedbackType, message));
    },
    [],
  );

  const setTranslatedMap = useCallback((translatedMap: TranslatedMap) => {
    dispatchRef.current.dispatch(setTranslatedMapAction(translatedMap));
  }, []);

  const closeFeedback = useCallback(() => {
    dispatchRef.current.dispatch(closeFeedbackAction());
  }, []);

  const logout = useCallback(() => {
    dispatchRef.current.dispatch(logoutAction());
  }, []);

  return {
    setRole,
    setUser,
    logout,
    setPrefersColorScheme,
    alertFeedback,
    closeFeedback,
    setTranslatedMap,
  };
}
