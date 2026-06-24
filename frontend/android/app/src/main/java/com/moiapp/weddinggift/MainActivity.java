package com.moiapp.weddinggift;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Set WebViewClient to handle all navigation within the app
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    // Load all URLs within the WebView, not in external browser
                    view.loadUrl(url);
                    return true;
                }
            });
            // Load the webapp from the server directly
            webView.loadUrl("https://dsitesai.com/moiapp");
        }
    }
}
