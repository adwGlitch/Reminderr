importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBFq-5AHXinn0D2l4P1XpP3OFWdLd0SZ-Q",
  authDomain: "remindsync-47dfb.firebaseapp.com",
  projectId: "remindsync-47dfb",
  storageBucket: "remindsync-47dfb.firebasestorage.app",
  messagingSenderId: "325397850025",
  appId: "1:325397850025:web:711442deae654b2245c6b8"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
