import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../theme';
import { setData } from '../storage';

const LOGIN_URL = 'https://www.jobsatamazon.co.uk/login';

// JS injected into the page to extract user info after login
const EXTRACT_USER_JS = `
(function() {
  try {
    // Check if we're on a logged-in page (not login/auth page)
    var url = window.location.href.toLowerCase();
    var isLoginPage = url.includes('login') || url.includes('signin') || url.includes('auth.hiring');
    
    if (!isLoginPage) {
      // Try to find user name/email from the page
      var name = '';
      var email = '';
      
      // Look for common elements that show user info
      var nameEl = document.querySelector('[data-test-id="user-name"], .user-name, .profile-name, [class*="userName"], [class*="user-name"], .nav-user-name');
      if (nameEl) name = nameEl.textContent.trim();
      
      var emailEl = document.querySelector('[data-test-id="user-email"], .user-email, .profile-email, [class*="userEmail"], [class*="user-email"]');
      if (emailEl) email = emailEl.textContent.trim();
      
      // Also check for any greeting text
      if (!name) {
        var greet = document.querySelector('[class*="greeting"], [class*="welcome"], [class*="hello"]');
        if (greet) name = greet.textContent.replace(/hello|welcome|hi|,/gi, '').trim();
      }
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'logged_in',
        name: name || '',
        email: email || '',
        url: window.location.href
      }));
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'login_page',
        url: window.location.href
      }));
    }
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: e.message }));
  }
})();
true;
`;

export default function AmazonLoginScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const webRef = useRef(null);

  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'logged_in') {
        setLoggedIn(true);
        const info = { name: data.name, email: data.email, url: data.url };
        setUserInfo(info);
        // Save login status
        await setData('amazon_login', {
          loggedIn: true,
          name: data.name || 'Amazon User',
          email: data.email || '',
          url: data.url,
          time: new Date().toISOString(),
        });
      }
    } catch {}
  };

  const onNavigationChange = (navState) => {
    const url = (navState.url || '').toLowerCase();
    // If navigated away from login/auth pages, inject extraction script
    if (!url.includes('login') && !url.includes('signin') && !url.includes('auth.hiring') && !url.includes('ap/signin')) {
      setTimeout(() => {
        webRef.current?.injectJavaScript(EXTRACT_USER_JS);
      }, 2000);
    }
  };

  const done = () => {
    if (loggedIn) {
      navigation.goBack();
    } else {
      Alert.alert('Not logged in yet', 'Please complete the login first, or go back if you want to skip.', [
        { text: 'Keep trying' },
        { text: 'Go back anyway', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={s.wrap}>
      {/* Status bar */}
      <View style={[s.statusBar, { backgroundColor: loggedIn ? '#00e67620' : '#ff990020', borderColor: loggedIn ? C.success : C.accent }]}>
        <View style={[s.dot, { backgroundColor: loggedIn ? C.success : C.danger }]} />
        <View style={{ flex: 1 }}>
          {loggedIn ? (
            <View>
              <Text style={[s.statusText, { color: C.success }]}>✅ Logged in successfully!</Text>
              {userInfo?.name ? <Text style={s.userText}>👤 {userInfo.name}</Text> : null}
              {userInfo?.email ? <Text style={s.userText}>📧 {userInfo.email}</Text> : null}
            </View>
          ) : (
            <Text style={[s.statusText, { color: C.accent }]}>🔑 Please log in below...</Text>
          )}
        </View>
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: loggedIn ? C.success : C.card }]} onPress={done}>
          <Text style={[s.doneBtnText, { color: loggedIn ? '#000' : C.dim }]}>{loggedIn ? '✓ Done' : 'Back'}</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {loading && (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loaderText}>Loading Amazon login...</Text>
        </View>
      )}
      <WebView
        ref={webRef}
        source={{ uri: LOGIN_URL }}
        style={{ flex: 1, opacity: loading ? 0 : 1 }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={onNavigationChange}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  statusBar: { padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontWeight: '700', fontSize: 14 },
  userText: { color: C.text, fontSize: 12, marginTop: 2 },
  doneBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  doneBtnText: { fontWeight: '600', fontSize: 14 },
  loader: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  loaderText: { color: C.dim, marginTop: 10, fontSize: 13 },
});
