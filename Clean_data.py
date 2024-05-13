import pandas as pd


df = pd.read_csv("C:/Users/LEON/Desktop/ChicagoCrime/crime.csv")

# Convert the Date column to datetime format
df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%Y %I:%M:%S %p')

# Get the current date
current_date = pd.Timestamp.now()

# Calculate the date 3 years ago
three_years_ago = current_date - pd.DateOffset(years=3)

# Filter the DataFrame to include only rows from the last 3 years
df_last_3_years = df[df['Date'] >= three_years_ago]


# Drop the specified columns
columns_to_drop = ['Case Number', 'IUCR', 'Updated On', 'Location', 'District', 'FBI Code', 'Community Area', 'Domestic', 'Beat', 'Ward']

df_last_3_years.drop(columns=columns_to_drop, inplace=True)


# Handle Missing Values
df_last_3_years.dropna(inplace=True)  # Remove rows with missing values

# Remove Duplicates
df_last_3_years.drop_duplicates(inplace=True)

# Print the DataFrame
print(df_last_3_years.head(10))


# Export the cleaned DataFrame to a CSV file
output_file = "C:/Users/LEON/Desktop/ChicagoCrime/cleaned_crime_data.csv" 

df_last_3_years.to_csv(output_file, index=False)

print("DataFrame successfully exported to:", output_file)


