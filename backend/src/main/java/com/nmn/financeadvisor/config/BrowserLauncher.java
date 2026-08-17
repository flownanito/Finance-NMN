package com.nmn.financeadvisor.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

@Component
public class BrowserLauncher implements ApplicationListener<ApplicationReadyEvent> {

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String os = System.getProperty("os.name").toLowerCase();
        boolean headless = java.awt.GraphicsEnvironment.isHeadless();
        
        if (System.getProperty("spring.profiles.active") != null && System.getProperty("spring.profiles.active").contains("test")) {
            return;
        }

        String url = "http://localhost:8085";
        System.out.println("\n==================================================================");
        System.out.println("NMN Finance Advisor ya está listo! Accede en: " + url);
        System.out.println("==================================================================\n");

        if (headless) {
            System.out.println("Entorno sin interfaz (headless). No se puede abrir el navegador automáticamente.");
            return;
        }

        try {
            if (os.contains("mac")) {
                Runtime.getRuntime().exec(new String[]{"open", url});
            } else if (os.contains("nix") || os.contains("nux")) {
                Runtime.getRuntime().exec(new String[]{"xdg-open", url});
            } else if (os.contains("win")) {
                Runtime.getRuntime().exec("cmd /c start " + url);
            } else if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
            }
        } catch (IOException | URISyntaxException e) {
            System.err.println("No se pudo iniciar el navegador automáticamente: " + e.getMessage());
        }
    }
}
