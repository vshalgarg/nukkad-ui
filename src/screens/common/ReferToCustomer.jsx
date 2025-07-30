// import React from 'react';
// import {
//   Image,
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import Entypo from 'react-native-vector-icons/Entypo';
// import Share from 'react-native-share';
// import RNFetchBlob from 'rn-fetch-blob';
// import { Image as RNImage } from 'react-native';
// import BackButton from '../../components/BackButton';
// import styles from '../../styles/globalStyles';
// import Colors from '../../styles/colors';
// import Fonts from '../../styles/font';

// const ReferToCustomer = () => {
//   const handleShare = async () => {
//     try {
//       // Load image asset
//       const image = require('../../../assets/images/qrImage.png');
//       const resolved = RNImage.resolveAssetSource(image);

//       // Copy asset image from bundle to a temp file path
//       const destPath = `${RNFetchBlob.fs.dirs.DocumentDir}/qrImage.png`;

//       const exists = await RNFetchBlob.fs.exists(destPath);
//       if (!exists) {
//         const data = await RNFetchBlob.config({ fileCache: true }).fetch(
//           'GET',
//           resolved.uri,
//         );
//         await RNFetchBlob.fs.cp(data.path(), destPath);
//       }

//       // Share the copied file
//       await Share.open({
//         title: 'Share Store QR',
//         message:
//           '🛍️ Add my store to start shopping!\n\n' +
//           '📲 Scan the QR code to add the store instantly.\n' +
//           '🆔 Or enter Store ID: 123456 manually in the app.\n\n' +
//           'Let’s start shopping today!',
//         url: `file://${destPath}`,
//         type: 'image/png',
//       });
//     } catch (error) {
//       console.error('Share error:', error);
//     }
//   };

//   return (
//     <View style={styles.pageContainer}>
//       <BackButton title="Refer to Customer" />
//       <View style={innerStyle.topContainer}>
//         <TouchableOpacity
//           style={innerStyle.shareIconContainer}
//           onPress={handleShare}
//         >
//           <Entypo name="share" size={28} color={Colors.primary} />
//         </TouchableOpacity>
//       </View>
//       <View style={innerStyle.container}>
//         <View style={innerStyle.qrSection}>
//           <Text style={innerStyle.heading}>Your QR Code</Text>
//           <View style={innerStyle.imageContainer}>
//             <Image
//               style={innerStyle.image}
//               source={require('../../../assets/images/qrImage.png')}
//             />
//           </View>
//         </View>

//         <View style={innerStyle.storeIdContainer}>
//           <Text style={innerStyle.label}>Store ID:</Text>
//           <Text style={innerStyle.id}>123456</Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default ReferToCustomer;

// const { height: screenHeight } = Dimensions.get('window');

// const innerStyle = StyleSheet.create({
//   topContainer: {
//     paddingRight: 20,
//   },
//   container: {
//     justifyContent: 'center',
//     gap: 15,
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: Colors.white,
//     height: screenHeight * 0.75,
//     marginTop: 16,
//   },
//   shareIconContainer: {
//     alignSelf: 'flex-end',
//     backgroundColor: Colors.borderColor,
//     padding: 10,
//     borderRadius: 50,
//     elevation: 2,
//   },
//   imageContainer: {
//     padding: 5,
//     borderRadius: 2,
//     elevation: 8,
//     backgroundColor: Colors.white,
//   },
//   heading: {
//     fontSize: Fonts.sizes.base,
//     fontWeight: '600',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   qrSection: {
//     alignItems: 'center',
//   },
//   image: {
//     height: 200,
//     width: 200,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//     backgroundColor:Colors.white,
//   },
//   storeIdContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   label: {
//     fontSize: Fonts.sizes.lg,
//     fontWeight: '500',
//   },
//   id: {
//     fontSize: Fonts.sizes.lg,
//     fontWeight: 'bold',
//     color: Colors.primary,
//     marginLeft: 4,
//   },
// });






import React, { useState, useRef } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import BackButton from '../../components/BackButton';
import styles from '../../styles/globalStyles';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';

const ReferToCustomer = () => {
  const [storeId] = useState('STR64872714461');
  const qrRef = useRef();
  const viewShotRef = useRef();

  const handleShare = async () => {
    try {
      // Capture QR code as image
      const uri = await viewShotRef.current.capture();
      
      // Share the captured image
      await Share.open({
        title: 'Share Store QR',
        message:
          '🛍️ Add my store to start shopping!\n\n' +
          '📲 Scan the QR code to add the store instantly.\n' +
          '🆔 Or enter Store ID: ' + storeId + ' manually in the app.\n\n' +
          'Let\'s start shopping today!',
        url: `file://${uri}`,
        type: 'image/png',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <BackButton title="Refer to Customer" />
      <View style={innerStyle.topContainer}>
        <TouchableOpacity
          style={innerStyle.shareIconContainer}
          onPress={handleShare}
        >
          {/* <Entypo name="share" size={28} color={Colors.primary} /> */}
          <EvilIcons name="share-google" color="#000" size={24} />
        </TouchableOpacity>
      </View>
      <View style={innerStyle.container}>
        <View style={innerStyle.qrSection}>
          <Text style={innerStyle.heading}>Mannu Sweets</Text>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.9 }}
            style={innerStyle.imageContainer}
          >
            <QRCode
              value={storeId}
              size={200}
              color={Colors.black}
              backgroundColor={Colors.white}
              getRef={qrRef}
            />
          </ViewShot>
        </View>

        <View style={innerStyle.storeIdContainer}>
          <Text style={innerStyle.label}>Store ID:</Text>
          <Text style={innerStyle.id}>{storeId}</Text>
        </View>
      </View>
    </View>
  );
};

export default ReferToCustomer;

const { height: screenHeight } = Dimensions.get('window');

const innerStyle = StyleSheet.create({
  topContainer: {
    paddingRight: 20,
  },
  container: {
    // justifyContent: 'center',
    gap: 15,
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    height: screenHeight * 0.75,
    marginTop: 16,
  },
  shareIconContainer: {
    alignSelf: 'flex-end',
    // backgroundColor: Colors.borderColor,
    // padding: 10,
    // borderRadius: 50,
    // elevation: 2,
    marginTop:30
  },
  imageContainer: {
    padding: 5,
    borderRadius: 2,
    elevation: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginVertical:30,
  },
  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    textAlign: 'left',
    // marginBottom: 30,
    marginTop: 30,
  },
  qrSection: {
    alignItems: 'center',
  },
  storeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '500',
  },
  id: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 4,
  },
});