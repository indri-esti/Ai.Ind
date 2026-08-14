package com.aiind.app;

import android.app.Activity;
import android.content.Context;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.appopen.AppOpenAd;

public class AppOpenAdManager {

    private static final String AD_UNIT_ID =
            "ca-app-pub-5699049952148750/5644057922";

    private AppOpenAd appOpenAd;
    private boolean isLoadingAd = false;
    private boolean isShowingAd = false;

    public void loadAd(Context context) {

        if (isLoadingAd || appOpenAd != null) {
            return;
        }

        isLoadingAd = true;

        AdRequest request =
                new AdRequest.Builder().build();

        AppOpenAd.load(
                context,
                AD_UNIT_ID,
                request,
                new AppOpenAd.AppOpenAdLoadCallback() {

                    @Override
                    public void onAdLoaded(AppOpenAd ad) {
                        appOpenAd = ad;
                        isLoadingAd = false;

                        android.util.Log.d(
                                "APP_OPEN_AD",
                                "IKLAN BERHASIL DIMUAT"
                        );
                    }

                    @Override
                    public void onAdFailedToLoad(
                            LoadAdError error) {

                        isLoadingAd = false;

                        android.util.Log.e(
                                "APP_OPEN_AD",
                                "GAGAL LOAD: " + error.toString()
                        );
                    }
                }
        );
    }

    public void showAdIfAvailable(Activity activity) {

        if (isShowingAd) {
            return;
        }

        if (appOpenAd == null) {
            android.util.Log.d(
                    "APP_OPEN_AD",
                    "IKLAN BELUM TERSEDIA"
            );

            loadAd(activity);
            return;
        }

        appOpenAd.setFullScreenContentCallback(
                new FullScreenContentCallback() {

                    @Override
                    public void onAdShowedFullScreenContent() {
                        isShowingAd = true;
                    }

                    @Override
                    public void onAdDismissedFullScreenContent() {
                        appOpenAd = null;
                        isShowingAd = false;

                        loadAd(activity);
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(
                            AdError adError) {

                        appOpenAd = null;
                        isShowingAd = false;

                        loadAd(activity);
                    }
                }
        );

        appOpenAd.show(activity);
    }
}