{
  description = "Development environment for Brienne monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
        # Definicion de dependencias requeridas por Playwright para ejecucion local
        playwrightLibraries = with pkgs; [
          alsa-lib
          at-spi2-atk
          cairo
          cups
          dbus
          expat
          glib
          gtk3
          libdrm
          libGL
          libxkbcommon
          mesa
          nspr
          nss
          pango
          systemd
          libX11
          libXcomposite
          libXdamage
          libXext
          libXfixes
          libXrandr
          libxcb
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Runtime de Node.js y gestores de paquetes
            nodejs_22
            pnpm
            typescript
            typescript-language-server

            # Binario nativo de esbuild compatible con NixOS
            esbuild

            # Cliente para inspeccion de base de datos local
            mongosh

            # Herramientas para Playwright y navegadores
            playwright-driver.browsers

            # Utilidades generales para desarrollo
            docker-compose
            git
          ];

          shellHook = ''
            # Configuracion de Playwright
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

            # Forzar a Vite/esbuild a usar el binario nativo de Nixpkgs
            export ESBUILD_BINARY_PATH="${pkgs.esbuild}/bin/esbuild"

            # Resolucion dinamica de bibliotecas para binarios externos
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath playwrightLibraries}:$LD_LIBRARY_PATH"

            # Inclusion de binarios locales en PATH
            export PATH="$PWD/node_modules/.bin:$PATH"

            echo "Brienne devShell inicializado correctamente (Node.js $(node --version))."
          '';
        };
      }
    );
}
