use std::{
    error::Error,
    fmt::Display,
    io::{self, Write},
    str::FromStr,
    thread,
    time::Duration,
};

use clap::Parser;

/// Simple remind tool
#[derive(Parser)]
#[command(version)]
struct Args {
    /// Run reminder only once
    #[arg(short, long)]
    once: bool,
    /// Time to wait before the reminder triggers (ex: 2h30m)
    delta: Delta,
    /// Optional reminder message (ex: "Go for a walk")
    message: Option<String>,
}

#[derive(Clone)]
struct Delta {
    hours: u8,
    minutes: u8,
}

impl FromStr for Delta {
    type Err = DeltaError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut hours = 0;
        let mut minutes = 0;
        let mut number = String::new();

        for c in s.chars() {
            match c.to_string().as_str() {
                "h" => {
                    hours = number
                        .parse()
                        .map_err(|_| DeltaError::new("Invalid hours"))?;
                    number.clear();
                }
                "m" => {
                    minutes = number
                        .parse()
                        .map_err(|_| DeltaError::new("Invalid minutes"))?;
                    number.clear();
                }
                _ => {
                    if c.is_numeric() {
                        number = format!("{}{}", number, c)
                    } else {
                        return Err(DeltaError::new("Invalid syntax, ex: 2h30m"));
                    }
                }
            }
        }

        Ok(Self { hours, minutes })
    }
}

#[derive(Debug)]
struct DeltaError {
    message: String,
}

impl DeltaError {
    fn new(message: &str) -> Self {
        Self {
            message: message.to_string(),
        }
    }
}

impl Display for DeltaError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl Error for DeltaError {}

fn main() -> io::Result<()> {
    let args = Args::parse();

    let seconds = u64::from(args.delta.hours) * 3600 + u64::from(args.delta.minutes) * 60;
    println!(
        "Remind in {} hour(s) and {} minute(s).",
        args.delta.hours, args.delta.minutes
    );

    thread::sleep(Duration::from_secs(seconds));

    print!("\x1b[2J\x1b[H");
    io::stdout().flush()?;

    let message = args.message.unwrap_or("Time is up!".to_string());
    loop {
        println!("\x07{}", message);
        if args.once {
            break;
        }
        thread::sleep(Duration::from_secs(30));
    }

    Ok(())
}
