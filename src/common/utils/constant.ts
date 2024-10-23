export const RegistrationConfirmEmailTemplate = `
    <html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>6Degrees Contest Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #FFFFFF;
      }

      .container {
        width: 100%;
      }

      .logo {
        text-align: center;
        margin-bottom: 20px;
        margin-top: 30px;
      }

      .logo img {
        width: 225px;
      }

      h1 {
        color: #333;
        margin-top: 0;
        font-size: 24px;
        font-weight: 500;
      }

      p {
        color: #333333;
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
      }

      .main-content {
        width: 60%;
        margin: auto;
      }

      .line-image {
        border: 4px solid #44e49f;
        margin: 0px 15% 3% 15%;
      }

      .vehicleImage {
        padding: 30px 20px;
      }

      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #44e49f;
        color: #000000;
        text-decoration: none;
        border-radius: 5px;
        transition: background-color 0.3s ease;
        border-radius: 50px;
        margin: 30px auto;
      }

      .button:hover {
        background-color: #44e49f;
      }

      .social {
        text-align: center;
        margin-top: 50px;
      }

      .social a {
        display: inline-block;
        margin: 0 10px;
        color: #555;
        text-decoration: none;
        font-size: 18px;
      }

      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #777;
      }

      .footer a {
        color: #000000;
        text-decoration: none;
        margin: 0px 10px;
        font-size: 12px;
      }
    </style>
    <style id="mttstyle">
        #mttContainer {
        left: 0 !important;
        top: 0 !important;
        width: 1000px !important;
        margin: 0px !important;
        margin-left: -500px !important;
        position: fixed !important;
        z-index: 100000200 !important;
        background: none !important;
        pointer-events: none !important;
        display: inline-block !important;
        visibility: visible  !important;
        white-space: pre-line;
        }
        .tippy-box[data-theme~="custom"], .tippy-content *{
        font-size: 18px  !important;
        text-align: center !important;
        overflow-wrap: break-word !important;
        color: #ffffffff !important;
        font-family: 
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", "Roboto", "Oxygen",
            "Ubuntu", "Cantarell", "Fira Sans",
            "Droid Sans", "Helvetica Neue", sans-serif  !important;
        white-space: pre-line;
        }
        .tippy-box[data-theme~="custom"]{
        max-width: 200px  !important;
        backdrop-filter: blur(4px) !important;
        background-color: #000000b8 !important;
        border: 1px solid #ffffff00; 
        }
        [data-tippy-root] {
        display: inline-block !important;
        visibility: visible  !important;
        position: absolute !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='top'] > .tippy-arrow::before { 
        border-top-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='bottom'] > .tippy-arrow::before {
        border-bottom-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='left'] > .tippy-arrow::before {
        border-left-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='right'] > .tippy-arrow::before {
        border-right-color: #000000b8 !important;
        }
        .mtt-highlight{
        background-color: #21dc6d40  !important;
        position: absolute !important;   
        z-index: 100000100 !important;
        pointer-events: none !important;
        display: inline !important;
        border-radius: 3px !important;
        }
        .mtt-image{
        width: 180px  !important;
        border-radius: 3px !important;
        }
        .ocr_text_div{
        position: absolute;
        opacity: 0.5;
        color: transparent !important;
        border: 2px solid CornflowerBlue;
        background: none !important;
        border-radius: 3px !important;
        }</style><style id="mttstyleSubtitle">
        #ytp-caption-window-container .ytp-caption-segment {
        cursor: text !important;
        user-select: text !important;
        font-family: 
        -apple-system, BlinkMacSystemFont,
        "Segoe UI", "Roboto", "Oxygen",
        "Ubuntu", "Cantarell", "Fira Sans",
        "Droid Sans", "Helvetica Neue", sans-serif  !important;
        }
        .caption-visual-line{
        display: flex  !important;
        align-items: stretch  !important;
        }
        .captions-text .caption-visual-line:first-of-type:after {
        content: '⣿⣿';
        background-color: #000000b8;
        display: inline-block;
        vertical-align: top;
        opacity:0;
        transition: opacity 0.7s ease-in-out;
        }
        .captions-text:hover .caption-visual-line:first-of-type:after {
        opacity:1;
        }
        .ytp-pause-overlay {
        display: none !important;
        }
        .ytp-expand-pause-overlay .caption-window {
        display: block !important;
        }
    </style></head>
    <body>
        <div class="container">
        <div class="logo">
            <img src="https://m.6degrees.co/assets/HeaderLogo.png" alt="6Degrees Logo">
        </div>
        <div class="line-image"></div>

        <div class="main-content">
            <h1>Hi,</h1>

            <p>
            Thanks for signing-up!
            </p>

            <div class="vehicleImage">
            <img src="https://media-assets.6degrees.co/assets/F2M-car-sharing-big.png" alt="Free2MOve fleet" style="width: 100%; max-height: 539.3px; max-width: 800px;">
            </div>

            <p>
            Refer a friend to a Free2move subscription to get $250 cash!
            </p>

            <p style="text-align: center">
            <a href="https://f2m.6degrees.co" class="button">Refer more friends!</a>
            </p>

            <p>Best Regards,</p>
            <div style="font-weight: 500; font-size: 14px">6Degrees team.</div>

            <div class="social">
            <p style="margin-bottom: 30px">
                Don't forget to follow us on X and Linkedin
            </p>
            <a href="https://x.com/6degrees_ai" target="_blank">
                <img src="https://media-assets.6degrees.co/assets/twitter-x.png" alt="X Logo" style="margin: 0px 20px 2px 0px">
            </a>
            <a href="https://www.linkedin.com/company/6degreesai"><img src="https://media-assets.6degrees.co/assets/Linkedin.png" alt="Linkedin Logo"></a>
            </div>

            <div class="footer">
            <a href="https://www.6degrees.co"><img src="https://media-assets.6degrees.co/assets/6D-poweredby-SUI.png" alt="6Degrees Logo" style="margin: 0px 20px 20px 0px"></a>
            <p>
                <a href="https://f2m.6degrees.co/privacy-policy/">Privacy Policy</a> | <a href="https://f2m.6degrees.co/terms-and-conditions/">terms of Use</a> |
                <a href="#">Unsubscribe</a>
            </p>
            </div>
        </div>
        </div>
    

    </body></html>
`;

export const ReferralConfirmEmailTemplate = (referred: number) => `
    <html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>6Degrees Contest Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #FFFFFF;
      }

      .container {
        width: 100%;
      }

      .logo {
        text-align: center;
        margin-bottom: 20px;
        margin-top: 30px;
      }

      .logo img {
        width: 225px;
      }

      h1 {
        color: #333;
        margin-top: 0;
        font-size: 24px;
        font-weight: 500;
      }

      p {
        color: #333333;
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        margin-top: 30px;
      }

      .main-content {
        width: 60%;
        margin: auto;
      }

      .line-image {
        border: 4px solid #44e49f;
        margin: 0px 15% 3% 15%;
      }

      .vehicleImage {
        padding: 30px 20px;
      }

      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #44e49f;
        color: #000000;
        text-decoration: none;
        border-radius: 5px;
        transition: background-color 0.3s ease;
        border-radius: 50px;
        margin: 30px auto;
      }

      .button:hover {
        background-color: #44e49f;
      }

      .social {
        text-align: center;
        margin-top: 50px;
      }

      .social a {
        display: inline-block;
        margin: 0 10px;
        color: #555;
        text-decoration: none;
        font-size: 18px;
      }

      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #777;
      }

      .footer a {
        color: #000000;
        text-decoration: none;
        margin: 0px 10px;
        font-size: 12px;
      }
    </style>
    <style id="mttstyle">
        #mttContainer {
        left: 0 !important;
        top: 0 !important;
        width: 1000px !important;
        margin: 0px !important;
        margin-left: -500px !important;
        position: fixed !important;
        z-index: 100000200 !important;
        background: none !important;
        pointer-events: none !important;
        display: inline-block !important;
        visibility: visible  !important;
        white-space: pre-line;
        }
        .tippy-box[data-theme~="custom"], .tippy-content *{
        font-size: 18px  !important;
        text-align: center !important;
        overflow-wrap: break-word !important;
        color: #ffffffff !important;
        font-family: 
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", "Roboto", "Oxygen",
            "Ubuntu", "Cantarell", "Fira Sans",
            "Droid Sans", "Helvetica Neue", sans-serif  !important;
        white-space: pre-line;
        }
        .tippy-box[data-theme~="custom"]{
        max-width: 200px  !important;
        backdrop-filter: blur(4px) !important;
        background-color: #000000b8 !important;
        border: 1px solid #ffffff00; 
        }
        [data-tippy-root] {
        display: inline-block !important;
        visibility: visible  !important;
        position: absolute !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='top'] > .tippy-arrow::before { 
        border-top-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='bottom'] > .tippy-arrow::before {
        border-bottom-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='left'] > .tippy-arrow::before {
        border-left-color: #000000b8 !important;
        }
        .tippy-box[data-theme~='custom'][data-placement^='right'] > .tippy-arrow::before {
        border-right-color: #000000b8 !important;
        }
        .mtt-highlight{
        background-color: #21dc6d40  !important;
        position: absolute !important;   
        z-index: 100000100 !important;
        pointer-events: none !important;
        display: inline !important;
        border-radius: 3px !important;
        }
        .mtt-image{
        width: 180px  !important;
        border-radius: 3px !important;
        }
        .ocr_text_div{
        position: absolute;
        opacity: 0.5;
        color: transparent !important;
        border: 2px solid CornflowerBlue;
        background: none !important;
        border-radius: 3px !important;
        }</style><style id="mttstyleSubtitle">
        #ytp-caption-window-container .ytp-caption-segment {
        cursor: text !important;
        user-select: text !important;
        font-family: 
        -apple-system, BlinkMacSystemFont,
        "Segoe UI", "Roboto", "Oxygen",
        "Ubuntu", "Cantarell", "Fira Sans",
        "Droid Sans", "Helvetica Neue", sans-serif  !important;
        }
        .caption-visual-line{
        display: flex  !important;
        align-items: stretch  !important;
        }
        .captions-text .caption-visual-line:first-of-type:after {
        content: '⣿⣿';
        background-color: #000000b8;
        display: inline-block;
        vertical-align: top;
        opacity:0;
        transition: opacity 0.7s ease-in-out;
        }
        .captions-text:hover .caption-visual-line:first-of-type:after {
        opacity:1;
        }
        .ytp-pause-overlay {
        display: none !important;
        }
        .ytp-expand-pause-overlay .caption-window {
        display: block !important;
        }
    </style></head>
    <body>
        <div class="container">
        <div class="logo">
            <img src="https://m.6degrees.co/assets/HeaderLogo.png" alt="6Degrees Logo">
        </div>
        <div class="line-image"></div>

        <div class="main-content">
            <h1>Hi,</h1>

            <p>
            Great news! One of your friends has accepted your referral.
            </p>

            <p>
            Your total Referred Users has increased by <span style="font-weight: 700;">${referred}!</span>
            <br><br><br>
            We will contact you if one of your referred friends converts by purchasing a Free2move subscription!
            </p>

            <p style="text-align: center">
            <a href="https://f2m.6degrees.co" class="button">Access Dashboard</a>
            </p>

            <p>Best Regards,</p>
            <div style="font-weight: 500; font-size: 14px">6Degrees team.</div>

            <div class="social">
            <p style="margin-bottom: 30px">
                Don't forget to follow us on X and Linkedin
            </p>
            <a href="https://x.com/6degrees_ai" target="_blank">
                <img src="https://media-assets.6degrees.co/assets/twitter-x.png" alt="X Logo" style="margin: 0px 20px 2px 0px">
            </a>
            <a href="https://www.linkedin.com/company/6degreesai"><img src="https://media-assets.6degrees.co/assets/Linkedin.png" alt="Linkedin Logo"></a>
            </div>

            <div class="footer">
            <a href="https://www.6degrees.co"><img src="https://media-assets.6degrees.co/assets/6D-poweredby-SUI.png" alt="6Degrees Logo" style="margin: 0px 20px 20px 0px"></a>
            <p>
                <a href="https://f2m.6degrees.co/privacy-policy/">Privacy Policy</a> | <a href="https://f2m.6degrees.co/terms-and-conditions/">terms of Use</a> |
                <a href="#">Unsubscribe</a>
            </p>
            </div>
        </div>
        </div>
    

    </body></html>
`;
