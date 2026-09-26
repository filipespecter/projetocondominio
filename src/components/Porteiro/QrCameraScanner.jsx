import {
  useEffect,
  useRef,
  useState,
} from "react";

function QrCameraScanner({
  active,
  onDetected,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;

    async function stop() {
      if (frameRef.current) {
        cancelAnimationFrame(
          frameRef.current
        );
      }

      streamRef.current
        ?.getTracks()
        ?.forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    async function start() {
      try {
        if (
          typeof BarcodeDetector ===
          "undefined"
        ) {
          throw new Error(
            "Este navegador não oferece leitura de QR pela câmera. Digite a credencial manualmente."
          );
        }

        const supported =
          await BarcodeDetector
            .getSupportedFormats();

        if (
          !supported.includes(
            "qr_code"
          )
        ) {
          throw new Error(
            "A leitura de QR não está disponível neste navegador. Digite a credencial manualmente."
          );
        }

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              video: {
                facingMode:
                  "environment",
              },
              audio: false,
            });

        if (cancelled) {
          stream
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );
          return;
        }

        streamRef.current =
          stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        const detector =
          new BarcodeDetector({
            formats: [
              "qr_code",
            ],
          });

        async function scan() {
          if (
            cancelled ||
            !videoRef.current
          ) {
            return;
          }

          try {
            const codes =
              await detector.detect(
                videoRef.current
              );

            const value =
              codes?.[0]?.rawValue;

            if (value) {
              await stop();
              onDetected?.(value);
              return;
            }
          } catch {
            // Mantém a câmera ativa e tenta o próximo frame.
          }

          frameRef.current =
            requestAnimationFrame(
              scan
            );
        }

        scan();
      } catch (err) {
        setError(
          err?.message ??
          "Não foi possível acessar a câmera."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, onDetected]);

  return (
    <div style={styles.wrap}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={styles.video}
      />

      <div style={styles.focus}>
        <div style={styles.focusBox}>
          Aponte para o QR
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "20px",
    background: "#111827",
    minHeight: "280px",
  },

  video: {
    width: "100%",
    minHeight: "280px",
    objectFit: "cover",
    display: "block",
  },

  focus: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  focusBox: {
    width: "190px",
    height: "190px",
    border: "3px solid white",
    borderRadius: "20px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: "10px",
    color: "white",
    fontWeight: "900",
    textShadow:
      "0 2px 8px rgba(0,0,0,0.8)",
  },

  error: {
    position: "absolute",
    left: "12px",
    right: "12px",
    bottom: "12px",
    background:
      "rgba(254,226,226,0.96)",
    color: "#991b1b",
    borderRadius: "14px",
    padding: "12px",
    fontSize: "12px",
    fontWeight: "700",
  },
};

export default QrCameraScanner;
