import { useRef, useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import {
  IonMenu,
  IonPage,
  IonHeader,
  IonContent,
  IonToolbar,
  IonList,
  IonLabel,
  IonItem,
} from '@ionic/react';

import './PageLayout.css';

import { Toolbar, MuiMaterial, Alert } from '@eten-lab/ui-kit';

import { useAppContext } from '../../hooks/useAppContext';

const { Snackbar, CircularProgress, Backdrop, Stack } = MuiMaterial;

interface PageLayoutProps {
  children?: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const history = useHistory();
  const location = useLocation();

  const {
    states: {
      global: { user, snack, isNewDiscussion, isNewNotification, loading },
    },
    actions: { closeFeedback },
  } = useAppContext();

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');
  const ref = useRef<HTMLIonMenuElement>(null);
  const prefersDarkRef = useRef<MediaQueryList | null>(null);
  const bodyRef = useRef<HTMLElement | null>(null);

  const toggleDarkTheme = (shouldToggle: boolean) => {
    if (shouldToggle) {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }

    bodyRef.current?.classList.toggle('dark', shouldToggle);
  };

  useEffect(() => {
    bodyRef.current = window.document.body;
    prefersDarkRef.current = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkRef.current.addListener((e) => {
      toggleDarkTheme(e.matches);
    });
    toggleDarkTheme(prefersDarkRef.current.matches);
  }, []);

  const handleToggleMenu = () => {
    ref.current!.toggle();
  };

  const handleToogleTheme = () => {
    if (themeMode === 'light') {
      toggleDarkTheme(true);
    } else {
      toggleDarkTheme(false);
    }
  };

  let isHeader = true;
  const qaUrl = user?.role === 'translator' ? '/translator-qa' : '/reader-qa';

  switch (location.pathname) {
    case '/welcome': {
      isHeader = false;
      break;
    }
    case '/login': {
      isHeader = false;
      break;
    }
    case '/register': {
      isHeader = false;
      break;
    }
    default: {
      break;
    }
  }

  return (
    <>
      <IonMenu ref={ref} contentId="crowd-bible-app">
        {isHeader ? (
          <IonHeader>
            <IonToolbar>
              <Toolbar
                title="crowd.Bible"
                buttons={{
                  notification: false,
                  discussion: false,
                  menu: false,
                }}
                themeMode={themeMode}
                onClickThemeModeBtn={handleToogleTheme}
                onClickDiscussionBtn={() => {
                  history.push('/discussions-list');
                }}
                onClickNotificationBtn={() => {
                  history.push('/notifications');
                }}
                onClickMenuBtn={handleToggleMenu}
              />
            </IonToolbar>
          </IonHeader>
        ) : null}
        <IonContent>
          <IonList>
            <IonItem href="/home">
              <IonLabel>Home</IonLabel>
            </IonItem>
            <IonItem href={qaUrl}>
              <IonLabel>Question & Answer</IonLabel>
            </IonItem>
            <IonItem href="/settings">
              <IonLabel>Settings</IonLabel>
            </IonItem>
            <IonItem href="/#">
              <IonLabel>Logout</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>
      <IonPage id="crowd-bible-app">
        {isHeader ? (
          <IonHeader>
            <IonToolbar>
              <Toolbar
                title="crowd.Bible"
                themeMode={themeMode}
                onClickThemeModeBtn={handleToogleTheme}
                isNewDiscussion={isNewDiscussion}
                isNewNotification={isNewNotification}
                onClickDiscussionBtn={() => {
                  history.push('/discussions-list');
                }}
                onClickNotificationBtn={() => {
                  history.push('/notifications');
                }}
                onClickMenuBtn={handleToggleMenu}
              />
            </IonToolbar>
          </IonHeader>
        ) : null}

        <IonContent fullscreen className="crowd-bible-ion-content">
          {children}

          <Snackbar
            open={snack.open}
            autoHideDuration={5000}
            onClose={closeFeedback}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            key="top-center"
          >
            <Alert
              variant="standard"
              onClose={closeFeedback}
              severity={snack.severity}
              sx={{ width: '100%' }}
            >
              {snack.message}
            </Alert>
          </Snackbar>

          <Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={loading}>
            <Stack justifyContent="center">
              <div style={{ margin: 'auto' }}>
                <CircularProgress color="inherit" />
              </div>
              <div>LOADING</div>
            </Stack>
          </Backdrop>
        </IonContent>
      </IonPage>
    </>
  );
}
