import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useIsPro } from '@/store/useIsPro';
import { BANNER_UNIT_ID } from '@/lib/ads';

/** Anchored adaptive banner shown to free users only; renders nothing for Pro. */
export default function AdBanner() {
  const isPro = useIsPro();
  if (isPro) return null;
  return <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />;
}
