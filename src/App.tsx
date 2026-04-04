import { useState } from 'react'
import './App.css'
// 定義天氣 API 回傳的型別
interface WeatherData {
  name: string;
  sys: {
    country: string;
  };
  coord: {
    lat: number;
    lon: number;
  };
  weather: {
    icon: string;
    description: string;
  }[];
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
}
// 定義維基百科景點的型別
interface Attraction {
  pageid: number;
  title: string;
  dist: number;
}
const App = () => {
  const [city, setCity] = useState("london");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_KEY = "3e9495fc9f6f9f088f0f971c8522d5bc";

  const handleSearch = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    setWeather(null);
    setAttractions([]);

    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=zh_tw&appid=${API_KEY}`
      );
      if (!weatherRes.ok) {
        throw new Error("找不到該城市，請確認拼字是否正確");
      }

      const weatherData: WeatherData = await weatherRes.json();
      setWeather(weatherData);

      const { lat, lon } = weatherData.coord;
      fetchAttractions(lat, lon);
    } catch (err) {
      // err 預設是 unknown，需要轉型
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttractions = async (lat: number, lon: number) => {
    try {
      const wikiRes = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=10&format=json&origin=*`
      );
      const wikiData = await wikiRes.json();

      if (wikiData.query && wikiData.query.geosearch) {
        setAttractions(wikiData.query.geosearch as Attraction[]);
      }
    } catch (err) {
      console.error("無法取得景點資料", err);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🌍 旅遊天氣小幫手</h1>
        <p>輸入城市，查看天氣與附近景點</p>
      </header>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          placeholder="輸入城市 (例如: 台北, Tokyo, London)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "搜尋中..." : "搜尋"}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {weather && (
        <div className="result-container">
          <div className="weather-card">
            <h2>
              📍 {weather.name}, {weather.sys.country}
            </h2>
            <div className="weather-info">
              <img
                src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="weather icon"
              />
              <div className="temp">{Math.round(weather.main.temp)}°C</div>
            </div>
            <p className="desc">{weather.weather[0].description}</p>
            <div className="details">
              <p>濕度: {weather.main.humidity}%</p>
              <p>風速: {weather.wind.speed} m/s</p>
            </div>
          </div>

          <div className="attractions-list">
            <h3>📸 附近熱門景點 (維基百科)</h3>
            {attractions.length > 0 ? (
              <ul>
                {attractions.map((place) => (
                  <li key={place.pageid}>
                      <a href={`https://zh.wikipedia.org/?curid=${place.pageid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {place.title}
                    </a>
                    <span className="distance">(距離 {place.dist} 公尺)</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>附近暫無維基百科條目資料。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default App
