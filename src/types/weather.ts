export interface CurrentWeather {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  icon: string;
  lastUpdated: string;
  isStormWarning: boolean;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
  precipitationChance: number;
}

export interface DailyForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  icon: string;
  precipitationChance: number;
  hourlyForecasts: HourlyForecast[];
}

export interface WeatherForecast {
  dailyForecasts: DailyForecast[];
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: WeatherForecast;
}
