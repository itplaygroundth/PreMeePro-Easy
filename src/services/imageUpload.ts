import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { apiService } from './api';

export interface ImageUploadResult {
  uri: string;
  publicUrl: string;
}

class ImageUploadService {
  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์เข้าถึงกล้อง',
          'กรุณาอนุญาตให้แอพเข้าถึงกล้องในการตั้งค่า'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์เข้าถึงคลังรูปภาพ',
          'กรุณาอนุญาตให้แอพเข้าถึงคลังรูปภาพในการตั้งค่า'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  }

  /**
   * Pick image from camera
   */
  async pickImageFromCamera(): Promise<ImageUploadResult | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return await this.uploadImage(asset.uri,"products");
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถถ่ายรูปได้');
      return null;
    }
  }

  /**
   * Pick image from library
   */
  async pickImageFromLibrary(): Promise<ImageUploadResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return await this.uploadImage(asset.uri,"products");
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้');
      return null;
    }
  }

  /**
   * Show image picker options (Camera or Library)
   */
  async showImagePickerOptions(): Promise<ImageUploadResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'เลือกรูปภาพ',
        'เลือกแหล่งที่มาของรูปภาพ',
        [
          {
            text: 'ถ่ายรูป',
            onPress: async () => {
              const result = await this.pickImageFromCamera();
              resolve(result);
            },
          },
          {
            text: 'เลือกจากคลัง',
            onPress: async () => {
              const result = await this.pickImageFromLibrary();
              resolve(result);
            },
          },
          {
            text: 'ยกเลิก',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Upload image to Supabase Storage
   */
  private async uploadImage(uri: string,bucketName:string): Promise<ImageUploadResult> {
    try {
      console.log('📤 Starting image upload:', uri);

      // Get file extension and name
      const fileExtension = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `product_${Date.now()}.${fileExtension}`;

      // Create FormData for React Native
      const formData = new FormData();

      // React Native FormData requires specific format
      formData.append('file', {
        uri: uri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      formData.append('bucketName', bucketName);

      console.log('📦 FormData prepared:', { fileName, bucketName});

      const uploadResult = await apiService.uploadImage(formData);

      console.log('✅ Upload successful:', uploadResult);

      return {
        uri,
        publicUrl: uploadResult.file.publicUrl,
      };
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
    }
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;
