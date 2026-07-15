import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  image: ImageSourcePropType;
  name?: string;
  title?: string;
  line?: string;
  mode?: 'hero' | 'compact' | 'seal';
  style?: StyleProp<ViewStyle>;
};

export default function CompanionPresence({
  image,
  name = '云游子',
  title = '断事老师',
  line = '这个字先不急着判，我先看它的形。',
  mode = 'compact',
  style,
}: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(blink, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(3200),
      ]),
    );

    breathLoop.start();
    blinkLoop.start();
    return () => {
      breathLoop.stop();
      blinkLoop.stop();
    };
  }, [blink, breath]);

  const isHero = mode === 'hero';
  const isSeal = mode === 'seal';
  const avatarSize = isHero ? 120 : isSeal ? 48 : 64;
  const avatarScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const glowScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.1] });
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.58] });
  const blinkScaleY = blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] });

  return (
    <View style={[styles.wrap, isHero && styles.wrapHero, isSeal && styles.wrapSeal, style]}>
      <View style={[styles.visual, { width: avatarSize, height: avatarSize }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <Animated.Image
          source={image}
          resizeMode="cover"
          style={[
            styles.avatar as ImageStyle,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              transform: [{ scale: avatarScale }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.blink,
            {
              width: avatarSize * 0.42,
              top: avatarSize * 0.38,
              transform: [{ scaleY: blinkScaleY }],
            },
          ]}
        />
      </View>
      {!isSeal ? (
        <View style={styles.copy}>
          <Text style={styles.kicker} numberOfLines={1}>
            {name} · {title}
          </Text>
          <Text style={[styles.line, isHero && styles.lineHero]} numberOfLines={isHero ? 3 : 2}>
            {line}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.24)',
    backgroundColor: 'rgba(11, 18, 32, 0.78)',
    padding: 12,
    overflow: 'hidden',
  },
  wrapHero: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  wrapSeal: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#D6B36A',
    shadowColor: '#D6B36A',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.5)',
    backgroundColor: '#17120D',
  },
  blink: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(246, 224, 178, 0.78)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#E6C77B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  line: {
    color: '#AAB3C5',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  lineHero: {
    color: '#D9E0EC',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
