export default function SplashScreen({ message = 'Loading your workspace…' }) {
  return (
    <div className="splash">
      <div className="splash-content">
        <img
          src="/static/brand/mark.svg"
          alt="Ko Naing Kyaw"
          className="splash-logo-img"
        />
        <div className="splash-brand">KO NAING KYAW</div>
        <div className="splash-tagline">FULL STACK DEVELOPER</div>
        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="splash-message">{message}</p>
      </div>
    </div>
  )
}