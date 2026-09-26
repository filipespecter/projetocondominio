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
            background:
              radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 34%),
              linear-gradient(180deg,#ffffff,#fbfaff);
            border: 1px solid rgba(124,58,237,0.18);
            box-shadow:
              0 24px 60px rgba(88,28,135,0.10),
              inset 0 0 0 1px rgba(255,255,255,0.75);
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
            background: linear-gradient(120deg,transparent,rgba(124,58,237,0.18),transparent);
            transform: skewX(-22deg);
            transition: 0.7s ease;
          }

          .access-card:hover::before {
            left: 140%;
          }

          .access-card:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: rgba(124,58,237,0.48);
            box-shadow:
              0 30px 80px rgba(88,28,135,0.18),
              0 0 34px rgba(124,58,237,0.16);
          }

          .access-card::after {
            content: "";
            position: absolute;
            inset: 14px;
            border-radius: 22px;
            border: 1px solid rgba(124,58,237,0.08);
            pointer-events: none;
          }

          .access-icon {
            width: 92px;
            height: 92px;
            border-radius: 28px;
            font-size: 52px;
            margin-bottom: 22px;
            color: white;
            background: linear-gradient(135deg,var(--card-color),#a855f7);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.35s ease;
            box-shadow: 0 18px 38px rgba(124,58,237,0.24);
          }

          .access-card:hover .access-icon {
            transform: scale(1.08) rotate(-3deg);
          }

          .access-title {
            font-size: 23px;
            font-weight: 900;
            color: #111827;
            margin-bottom: 12px;
          }

          .access-description {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
            margin-bottom: 24px;
          }

          .access-button {
            border: none;
            border-radius: 999px;
            padding: 12px 28px;
            background: linear-gradient(135deg, var(--button-color), #a855f7);
            color: white;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(124,58,237,0.22);
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
