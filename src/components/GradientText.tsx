import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextProps } from 'react-native';
import { gradient } from '../theme';

export default function GradientText({ style, children, ...rest }: TextProps) {
  return (
    <MaskedView
      maskElement={
        <Text {...rest} style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {/* invisible copy only provides the size; the gradient shows through the mask */}
        <Text {...rest} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}