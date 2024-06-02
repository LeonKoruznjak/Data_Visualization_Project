import pandas as pd

df = pd.read_csv("C:/Users/LEON/Desktop/ChicagoCrime/data/crime.csv")

# Convert the Date column to datetime format
df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%Y %I:%M:%S %p')

# Filter the DataFrame to include only rows from the years 2015, 2016, and 2017
df_filtered_years = df[df['Year'].isin([2015, 2016, 2017])]

# Drop the specified columns
columns_to_drop = ['Case Number', 'IUCR', 'Updated On', 'Location', 'District', 'FBI Code', 'Community Area', 'Domestic', 'Beat', 'Ward']
df_filtered_years.drop(columns=columns_to_drop, inplace=True)

# Handle Missing Values
df_filtered_years.dropna(inplace=True)  # Remove rows with missing values

# Remove Duplicates
df_filtered_years.drop_duplicates(inplace=True)

# Print the DataFrame
print(df_filtered_years.head(10))

# Export the cleaned DataFrame to a CSV file
output_file = "C:/Users/LEON/Desktop/ChicagoCrime/cleaned_crime_data1.csv"
df_filtered_years.to_csv(output_file, index=False)

print("DataFrame successfully exported to:", output_file)
