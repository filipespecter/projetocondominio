function AccessCard({ icon, title, description, color, buttonColor }) {
  return (
    <>
      <style>
        {`
          .access-card {
            position: relative;
            width: 280px;
            height: 340px;
            border-radius: 28px;
            padding: 26px;
            overflow: hidden;
            cursor: pointer;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.18),
              rgba(255,255,255,0.08)
            );
            border: 1px solid rgba(255,255,255,0.22);
            box-shadow: 0 24px 60px rgba(0,0,0,0.28);
            backdrop-filter: blur(18px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: 0.35s ease;
          }

          .access-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: -120%;
            width: 70%;
            height: 100%;
            background: linear-gradient(
              120deg,
              transparent,
              rgba(250,204,21,0.55),
              transparent
            );
            transform: skewX(-22deg);
            transition: 0.7s ease;
          }

          .access-card:hover::before {
            left: 140%;
          }

          .access-card:hover {
            transform: translateY(-14px) scale(1.03);
            border-color: rgba(250,204,21,0.75);
            box-shadow:
              0 30px 80px rgba(0,0,0,0.38),
              0 0 30px rgba(250,204,21,0.18);
          }

          .access-icon {
            font-size: 78px;
            margin-bottom: 22px;
            color: var(--card-color);
            transition: 0.35s ease;
            filter: drop-shadow(0 0 18px rgba(255,255,255,0.16));
          }

          .access-card:hover .access-icon {
            transform: scale(1.16) rotate(-3deg);
            color: #facc15;
          }

          .access-title {
            font-size: 23px;
            font-weight: 900;
            color: white;
            margin-bottom: 12px;
          }

          .access-description {
            font-size: 14px;
            color: rgba(255,255,255,0.72);
            line-height: 1.5;
            margin-bottom: 24px;
          }

          .access-button {
            border: none;
            border-radius: 999px;
            padding: 12px 28px;
            background: linear-gradient(135deg, var(--button-color), #facc15);
            color: white;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(0,0,0,0.25);
          }
        `}
      </style>

      <div
        className="access-card"
        style={{
          "--card-color": color,
          "--button-color": buttonColor
        }}
      >
        <div className="access-icon">
          {icon}
        </div>

        <div className="access-title">
          {title}
        </div>

        <div className="access-description">
          {description}
        </div>

        <button className="access-button">
          Entrar
        </button>
      </div>
    </>
  );
}

export default AccessCard;