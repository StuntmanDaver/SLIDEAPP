import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

// Configure third-party components to accept className prop
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
