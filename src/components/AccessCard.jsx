function AccessCard({ icon, title, description, color, buttonColor }) {
  return (
    <>
      <style>
        {`
          .access-card{
            position:relative;
            width:100%;
            max-width:300px;
            height:360px;
            border-radius:32px;
            padding:28px;
            overflow:hidden;
            cursor:pointer;
            box-sizing:border-box;

            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.78),
                rgba(255,255,255,.56)
              );

            border:1px solid rgba(124,58,237,.16);

            backdrop-filter:blur(18px);

            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            text-align:center;

            transition:.35s;

            box-shadow:
              0 24px 60px rgba(88,28,135,.10),
              inset 0 1px 0 rgba(255,255,255,.65);
          }

          .access-card::before{
            content:"";
            position:absolute;
            inset:0;

            background:
              linear-gradient(
                135deg,
                transparent,
                rgba(255,255,255,.45),
                transparent
              );

            transform:translateX(-120%);
            transition:.8s;
          }

          .access-card:hover::before{
            transform:translateX(120%);
          }

          .access-card::after{

            content:"";

            position:absolute;

            width:240px;
            height:240px;

            border-radius:50%;

            background:var(--card-color);

            opacity:.08;

            top:-90px;
            right:-90px;

            filter:blur(45px);

          }

          .access-card:hover{

            transform:translateY(-12px) scale(1.03);

            border-color:rgba(124,58,237,.35);

            box-shadow:

              0 35px 80px rgba(88,28,135,.18),

              0 0 40px rgba(124,58,237,.12);

          }

          .access-icon{

            width:95px;
            height:95px;

            border-radius:28px;

            display:flex;
            justify-content:center;
            align-items:center;

            background:
              linear-gradient(
                135deg,
                var(--card-color),
                #a855f7
              );

            color:white;

            font-size:46px;

            margin-bottom:24px;

            box-shadow:
              0 18px 40px rgba(124,58,237,.22);

            transition:.35s;

          }

          .access-card:hover .access-icon{

            transform:rotate(-6deg) scale(1.12);

          }

          .access-title{

            color:#111827;

            font-size:24px;

            font-weight:900;

            margin-bottom:14px;

          }

          .access-description{

            color:#6b7280;

            line-height:1.6;

            font-size:14px;

            margin-bottom:28px;

            min-height:64px;

          }

          .access-button{

            border:none;

            border-radius:999px;

            padding:14px 34px;

            font-size:15px;

            font-weight:900;

            color:white;

            cursor:pointer;

            background:
              linear-gradient(
                135deg,
                var(--button-color),
                #a855f7
              );

            box-shadow:
              0 16px 32px rgba(124,58,237,.24);

            transition:.3s;

          }

          .access-button:hover{

            transform:scale(1.04);

            box-shadow:
              0 20px 40px rgba(124,58,237,.34);

          }

          @media (max-width: 380px) {
            .access-card{
              height:auto;
              min-height:300px;
              padding:22px;
            }
            .access-icon{
              width:72px;
              height:72px;
              font-size:34px;
              margin-bottom:16px;
            }
            .access-title{
              font-size:20px;
              margin-bottom:10px;
            }
            .access-description{
              min-height:0;
              margin-bottom:20px;
            }
            .access-button{
              padding:12px 28px;
            }
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
          Entrar →
        </button>

      </div>
    </>
  );
}

export default AccessCard;