import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsPro } from '@/store/useIsPro';
import { BANNER_UNIT_ID } from '@/lib/ads';
import { useTheme } from '@/theme/useTheme';

let BannerAd: any = null;
let BannerAdSize: any = null;
let isAdsAvailable = false;

try {
  const adsModule = require('react-native-google-mobile-ads');
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
  isAdsAvailable = !!BannerAd;
} catch (e) {
  // Silent fallback
}

/** Anchored adaptive banner shown to free users only; renders a mock indicator in Expo Go/mock mode, nothing for Pro. */
export default function AdBanner() {
  const isPro = useIsPro();
  const colors = useTheme();

  if (isPro) return null;

  if (isAdsAvailable && BannerAd && BannerAdSize) {
    return <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />;
  }

  // Beautiful fallback placeholder for development / Expo Go
  return (
    <View style={[
      styles.placeholderContainer,
      { backgroundColor: colors.card, borderColor: colors.border }
    ]}>
      <Text style={[styles.placeholderText, { color: colors.muted }]}>
        [Sponsored Ad Banner Placeholder]
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    height: 50,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

