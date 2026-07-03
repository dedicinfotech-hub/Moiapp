import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationRef, navigateToPublicHome, isLoggedInSession } from './navigationRef';
import type { GuestStackParamList } from './types';

type GuestNav = NativeStackNavigationProp<GuestStackParamList>;

/** Open guest form with Landing underneath so back always has a target. */
export function navigateToGuestForm(token: string, opts?: { eventSlug?: string }) {
  if (!navigationRef.isReady()) return;

  const guestFlowState = {
    index: 1,
    routes: [
      { name: 'GuestLanding' as const, params: { token } },
      { name: 'GuestForm' as const, params: { token } },
    ],
  };

  if (isLoggedInSession()) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'GuestFlow',
        params: {
          screen: 'GuestForm',
          params: { token },
        },
      })
    );
    return;
  }

  const publicBrowseState = opts?.eventSlug
    ? {
        index: 1,
        routes: [
          { name: 'PublicHome' as const },
          { name: 'PublicEventDetail' as const, params: { slug: opts.eventSlug } },
        ],
      }
    : undefined;

  const routes = publicBrowseState
    ? [
        { name: 'PublicFlow' as const, state: publicBrowseState },
        { name: 'GuestFlow' as const, state: guestFlowState },
      ]
    : [{ name: 'GuestFlow' as const, state: guestFlowState }];

  navigationRef.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    })
  );
}

/** Safe back within guest flow — avoids unhandled GO_BACK when stack has one screen. */
export function goBackInGuestStack(
  navigation: GuestNav,
  token: string,
  fallback: 'landing' | 'form' | 'exit' = 'landing'
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (fallback === 'form') {
    navigation.navigate('GuestForm', { token });
    return;
  }

  if (fallback === 'landing') {
    navigation.navigate('GuestLanding', { token });
    return;
  }

  const parent = navigation.getParent();
  if (parent?.canGoBack()) {
    parent.goBack();
    return;
  }

  navigateToPublicHome();
}
