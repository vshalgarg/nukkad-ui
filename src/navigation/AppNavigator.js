import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        gestureEnabled: false,
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Splash"
        getComponent={() => require('../screens/SplashScreen.jsx').default}
      />
      <Stack.Screen
        name="Home"
        getComponent={() => require('../screens/HomeScreen.jsx').default}
      />
      <Stack.Screen
        name="MobileOtpScreen"
        getComponent={() =>
          require('../screens/auth/MobileOtpScreen.jsx').default
        }
      />
      <Stack.Screen
        name="CustomerCreateProfile"
        getComponent={() =>
          require('../screens/customer/CustomerCreateProfile.jsx').default
        }
      />
      <Stack.Screen
        name="AddStore"
        getComponent={() => require('../screens/customer/AddStore.jsx').default}
      />
      <Stack.Screen
        name="CustomerDashboard"
        getComponent={() =>
          require('../screens/customer/CustomerDashboard.jsx').default
        }
      />
      <Stack.Screen
        name="ProductPage"
        getComponent={() =>
          require('../screens/customer/ProductPage.jsx').default
        }
      />
      <Stack.Screen
        name="ShoppingCart"
        getComponent={() =>
          require('../screens/customer/ShoppingCart.jsx').default
        }
      />
      <Stack.Screen
        name="AddressForm"
        getComponent={() =>
          require('../screens/customer/AddressForm.jsx').default
        }
      />
      <Stack.Screen
        name="Address"
        getComponent={() => require('../screens/customer/Address.jsx').default}
      />
      <Stack.Screen
        name="PlaceOrder"
        getComponent={() =>
          require('../screens/customer/PlaceOrder.jsx').default
        }
      />
      <Stack.Screen
        name="StorekeeperCreateProfile"
        getComponent={() =>
          require('../screens/storekeeper/StorekeeperCreateProfile.jsx').default
        }
      />
      <Stack.Screen
        name="StorekeeperDashboard"
        getComponent={() =>
          require('../screens/storekeeper/StorekeeperDashboard.jsx').default
        }
      />
      <Stack.Screen
        name="ShowDetails"
        getComponent={() =>
          require('../screens/storekeeper/ShowDetails.jsx').default
        }
      />
      <Stack.Screen
        name="StorekeeperProfileSetting"
        getComponent={() =>
          require('../screens/storekeeper/StorekeeperProfileSetting.js').default
        }
      />
      <Stack.Screen
        name="ReferToCustomer"
        getComponent={() =>
          require('../screens/common/ReferToCustomer.jsx').default
        }
      />
      <Stack.Screen
        name="StoreDetail"
        getComponent={() =>
          require('../screens/storekeeper/StoreDetail.jsx').default
        }
      />
      <Stack.Screen
        name="PaymentOptions"
        getComponent={() =>
          require('../screens/storekeeper/PaymentOptions.jsx').default
        }
      />
      <Stack.Screen
        name="HelpSupport"
        getComponent={() =>
          require('../screens/common/HelpSupport.jsx').default
        }
      />
      <Stack.Screen
        name="MyStores"
        getComponent={() => require('../screens/customer/MyStores.jsx').default}
      />
      <Stack.Screen
        name="Notification"
        getComponent={() =>
          require('../screens/common/Notification.jsx').default
        }
      />
      <Stack.Screen
        name="Orders"
        getComponent={() => require('../screens/common/Orders.jsx').default}
      />
      <Stack.Screen
        name="ProfileSetting"
        getComponent={() =>
          require('../screens/customer/ProfileSetting.jsx').default
        }
      />
      <Stack.Screen
        name="RateStore"
        getComponent={() =>
          require('../screens/customer/RateStore.jsx').default
        }
      />
    </Stack.Navigator>
  );
}
