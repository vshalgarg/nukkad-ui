import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { useAuth } from '../../contexts/authContext';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { z } from 'zod';


const profileSchema = z.object({
    name: z.string().min(1, "Name is required").max(30, "Name can't be more that 30 characters"),
    storeName: z.string().min(1, "Store Name is required").max(30, "Store name can't be more that 30 characters"),
    contactNumber: z
        .string()
        .min(1, "Contact Number is required")
        .regex(/^\d{10}$/, "Contact Number must be exactly 10 digits"),
    gstNum: z.string().min(1, "GST Number is required").max(30, "GST Number can't be more that 30 characters"),
    storeQrId: z.string().optional(),
    addressLine1: z.string().min(1, "Address is required").max(100, "Address can't be more that 100 characters"),
    addressLine2: z.string().min(1, "Address is required").max(100, "Address can't be more that 100 characters"),
    landmark: z.string().min(1, "Landmark is required").max(200, "Landmark can't be more that 100 characters"),
    city: z.string().min(1, "City is required").max(30, "City can't be more that 30 characters"),
    state: z.string().min(1, "State is required").max(30, "State can't be more that 30 characters"),
    pincode: z.string().min(6, "Pincode must be 6 digits long").max(6, "Pincode must be 6 digits long"),
    imageUrls: z.array(z.string().nullable()).optional(),
});


const fieldGroups = [
    {
        title: "Personal Details",
        fields: [
            { label: "Name", key: "name" },
            { label: "Store Name", key: "storeName" },
            { label: "Contact Number", key: "contactNumber" },
            { label: "GST Number", key: "gstNum" },
            { label: "Store QR ID", key: "storeQrId" },
        ]
    },
    {
        title: "Address Details",
        fields: [
            { label: "Address Line 1", key: "addressLine1" },
            { label: "Address Line 2", key: "addressLine2" },
            { label: "Landmark", key: "landmark" },
            { label: "City", key: "city" },
            { label: "State", key: "state" },
            { label: "Pincode", key: "pincode" }
        ]
    }
];

const StorekeeperProfileScreen = () => {
    const { storekeeperProfile, updateStorekeeperProfile } = useStorekeeperProfile();
    const { token } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    // const [errors, setErrors] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        storeName: '',
        contactNumber: '',
        gstNum: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [profile, setProfile] = useState({
        name: '',
        storeName: "",
        contactNumber: '',
        gstNum: "",
        storeQrId: "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        imageUrls: []
    });
    // Create refs for each input field
    const nameRef = useRef(null);
    const storeNameRef = useRef(null);
    const contactNumberRef = useRef(null);
    const gstNumRef = useRef(null);
    const addressLine1Ref = useRef(null);
    const addressLine2Ref = useRef(null);
    const landmarkRef = useRef(null);
    const cityRef = useRef(null);
    const stateRef = useRef(null);
    const pincodeRef = useRef(null);

    // Create a mapping of field keys to their refs
    const fieldRefs = {
        name: nameRef,
        storeName: storeNameRef,
        contactNumber: contactNumberRef,
        gstNum: gstNumRef,
        addressLine1: addressLine1Ref,
        addressLine2: addressLine2Ref,
        landmark: landmarkRef,
        city: cityRef,
        state: stateRef,
        pincode: pincodeRef
    };

    const inputRefs = useRef({
        name: null,
        storeName: null,
        contactNumber: null,
        gstNum: null,
        addressLine1: null,
        addressLine2: null,
        landmark: null,
        city: null,
        state: null,
        pincode: null
    });

    const scrollViewRef = useRef(null);

    const scrollToError = (firstErrorKey) => {
        const fieldRef = fieldRefs[firstErrorKey]?.current;
        if (fieldRef) {
            fieldRef.focus();
            // For scrolling, we'll use a simpler approach
            fieldRef.measure((x, y, width, height, pageX, pageY) => {
                scrollViewRef.current?.scrollTo({ y: pageY - 100, animated: true });
            });
        }
    };

    useEffect(() => {
        if (storekeeperProfile) {
            setProfile({ ...storekeeperProfile });
        }
    }, [storekeeperProfile]);


    const handleChange = (key, value) => {
        setProfile(prev => ({ ...prev, [key]: value }));
        if (isEditing) {
            validateSingleField(key, value);
        }
    };

    const validateSingleField = (key, value) => {
        try {
            // Create a subset of your schema for just this field
            const fieldSchema = profileSchema.pick({ [key]: true });
            fieldSchema.parse({ [key]: value });
            setFieldErrors(prev => ({ ...prev, [key]: '' }));
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.errors[0].message;
                setFieldErrors(prev => ({ ...prev, [key]: errorMessage }));
                return false;
            }
            return false;
        }
    };
    const handleImagePick = (index) => {
        const options = {
            mediaType: 'photo',
            quality: 0.7,
        };


        launchImageLibrary(options, (response) => {
            if (response.didCancel) return;

            if (response.assets && response.assets.length > 0) {
                const uri = response.assets[0].uri;
                setProfile((prev) => {
                    const updated = [...prev.imageUrls];
                    updated[index] = uri; // replace image at index
                    return { ...prev, imageUrls: updated };
                });
            }
        });
    };
    const handleRemoveImage = (index) => {
        setProfile((prev) => {
            const updated = [...prev.imageUrls];
            updated.splice(index, 1, null); // Set null to maintain slot
            return { ...prev, imageUrls: updated };
        });
    };
    const handleSave = async () => {
        // Validate all fields first
        let isValid = true;
        let firstErrorKey = null;
        const fieldsToValidate = Object.keys(fieldErrors);

        fieldsToValidate.forEach(key => {
            if (!validateSingleField(key, profile[key])) {
                if (!firstErrorKey) {
                    firstErrorKey = key;
                }
                isValid = false;
            }
        });

        if (!isValid) {
            scrollToError(firstErrorKey);
            return;
        }

        // Rest of your save logic remains the same
        const allowedFields = [
            'name', 'storeName', 'contactNumber', 'gstNum', 'storeQrId',
            'addressLine1', 'addressLine2', 'landmark', 'city', 'state',
            'pincode', 'imageUrls'
        ];

        const filteredProfile = allowedFields.reduce((acc, key) => {
            acc[key] = profile[key];
            return acc;
        }, {});

        try {
            await updateStorekeeperProfile(filteredProfile, token);
            Toast.show({
                type: 'success',
                text1: 'Profile Updated',
            });
            setIsEditing(false);
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: err?.message || 'Something went wrong',
            });
        }
    };


    return (

        <View style={{ flex: 1 }}>
            <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={styles.header}>Profile Setting</Text>
                <View style={{ marginBottom: 20 }}>
                    <TouchableOpacity
                        style={styles.editIcon}
                        onPress={() => setIsEditing(!isEditing)}
                    >
                        <Icon name="edit" size={20} />
                    </TouchableOpacity>
                </View>


                {fieldGroups.map((group, index) => (
                    <View key={index} style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{group.title}</Text>
                        {group.fields.map((field) => renderField(field.label, field.key))}
                    </View>
                ))}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Store Images</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: "space-between" }}>
                        {[0, 1, 2, 3].map((i) => {
                            const image = profile.imageUrls[i];
                            return (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => isEditing && !image && handleImagePick(i)}
                                    style={{ position: 'relative', marginBottom: 10 }}
                                    activeOpacity={0.8}
                                >
                                    {image ? (
                                        <View>
                                            <Image
                                                source={{ uri: image }}
                                                style={styles.image}
                                            />
                                            {isEditing && (
                                                <TouchableOpacity
                                                    style={styles.removeIcon}
                                                    onPress={() => handleRemoveImage(i)}
                                                >
                                                    <Icon name="x" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={[styles.image, styles.emptyImage]}>
                                            <Text style={{ color: '#888', fontSize: 20 }}>+</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>


            </ScrollView>

            {isEditing && (
                <View style={styles.fixedSaveButtonContainer}>
                    <TouchableOpacity style={styles.fixedSaveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

    );

    function renderField(label, key) {
        if (key === 'storeQrId') {
            return (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <View style={[styles.fullInput, { backgroundColor: '#f8f8f8' }]}>
                        <Text>{profile[key]}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.inputContainer} key={key}>
                <Text style={styles.label}>{label}</Text>
                {isEditing ? (
                    <>
                        <TextInput
                            ref={fieldRefs[key]}
                            style={[
                                styles.fullInput,
                                fieldErrors[key] && styles.errorInput
                            ]}
                            value={profile[key]}
                            onChangeText={val => handleChange(key, val)}
                            placeholder={label}
                            onBlur={() => validateSingleField(key, profile[key])}
                        />
                        {fieldErrors[key] ? (
                            <Text style={styles.errorText}>{fieldErrors[key]}</Text>
                        ) : null}
                    </>
                ) : (
                    <View style={[styles.fullInput, { backgroundColor: '#fff' }]}>
                        <Text>{profile[key]}</Text>
                    </View>
                )}
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 70,
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 30,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    fullInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#f8f8f8',
    },
    fieldWrapper: {
        marginBottom: 24, // Increased spacing
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    profileHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    // In your StyleSheet
    fixedSaveButtonContainer: {
        position: 'absolute',
        bottom: 0,  // Changed from 20 to stick to bottom
        left: 0,
        right: 0,
        backgroundColor: 'white',  // Solid background
        paddingTop: 10,  // Space above button
        paddingBottom: 20,  // Extra space at bottom for device curves
        paddingHorizontal: 16,  // Side padding
        zIndex: 10,
        // Shadow styling (optional)
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },  // Shadow above
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    fixedSaveButton: {
        width: '100%',
        backgroundColor: '#007bff',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 10,
        resizeMode: 'cover',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ff4444',
        borderRadius: 12,
        padding: 4,
        zIndex: 10,
        elevation: 3,
    },

    emptyImage: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorInput: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
    },
    sectionContainer: {
        marginBottom: 24,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
});

export default StorekeeperProfileScreen;