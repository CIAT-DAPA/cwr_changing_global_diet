# Changing global diet - Processing data
# H. Achicanoy
# CIAT, 2016

# R options
options(warn = -1)
options(scipen = 999)

# load packages
suppressMessages(library(dplyr))
suppressMessages(library(tidyr))
suppressMessages(library(ggplot2))
suppressMessages(library(caroline))
suppressMessages(library(purrr))
suppressMessages(library(broom))
suppressMessages(library(ggplot2))
suppressMessages(library(epanetReader))
suppressMessages(library(ff))
suppressMessages(library(ffbase))

# load global diet data
# It's better to use Sara's data: CropData_longform.rpt (PENDING)
all_data <- read.csv('all_1961_2009_final_analysis_data_final_2016_10_28.csv')

# load food groups
gFood <- read.csv('FBS_commodities_foodgroups_regions_finaltest.csv')
gFood <- gFood %>% dplyr::select(Item:food_group) %>% unique

# merging global diet and food groups data
all_data2 <- dplyr::left_join(all_data, gFood, by=c('Item'))
rm(all_data, gFood)

# reshape dataset
all_data2 <- all_data2 %>% tidyr::gather(Year, Value, Y1961:Y2009)
all_data2$Year <- as.numeric(gsub(pattern='Y', replacement='', x=all_data2$Year))
all_data2$food_group <- as.character(all_data2$food_group)

# updates on food_group column
all_data2$food_group <- gsub(pattern = "Cereals", replacement = "Grains", x = all_data2$food_group, fixed = T)
all_data2$food_group <- gsub(pattern = "Oilcrops", replacement = "Oils", x = all_data2$food_group, fixed = T)
all_data2$food_group <- gsub(pattern = "Sugarcrops", replacement = "Sweeteners", x = all_data2$food_group, fixed = T)
all_data2$food_group <- gsub(pattern = "^Spices$", replacement = "Spices and stimulants", x = all_data2$food_group)
all_data2$food_group <- gsub(pattern = "^Stimulants$", replacement = "Spices and stimulants", x = all_data2$food_group)

# updates on country names
all_data2$Country <- as.character(all_data2$Country)
all_data2$Country <- gsub(pattern = "Antigua and Barbuda", replacement = "Antigua and Barb.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Belgium-Luxembourg", replacement = "Belgium and Lux.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Bolivia \\(Plurinational State of\\)", replacement = "Bolivia", x = all_data2$Country)
all_data2$Country <- gsub(pattern = "Brunei Darussalam", replacement = "Brunei Dar.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Central African Republic", replacement = "Cent. African Rep.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Central African Republic", replacement = "Cent. African Rep.", x = all_data2$Country, fixed = T)
all_data2$Country[grep(pattern = "C?te d'Ivoire", x = all_data2$Country, fixed = TRUE)] <- 'Ivory Coast' # Windows
all_data2$Country[grep(pattern = "Côte d'Ivoire", x = all_data2$Country, fixed = TRUE)] <- 'Ivory Coast' # Windows
# all_data2$Country[grep(pattern = "C\364te d'Ivoire", x = all_data2$Country, fixed = TRUE)] <- 'Ivory Coast' # MB
all_data2$Country <- gsub(pattern = "Democratic People's Republic of Korea", replacement = "North Korea", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Dominican Republic", replacement = "Dominican Rep.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Ethiopia PDR", replacement = "Ethiopia", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Iran \\(Islamic Republic of\\)", replacement = "Iran", x = all_data2$Country)
all_data2$Country <- gsub(pattern = "Lao People's Democratic Republic", replacement = "Laos", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Republic of Korea", replacement = "Rep. of Korea", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Saint Kitts and Nevis", replacement = "St. Kitts", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Saint Vincent and the Grenadines", replacement = "St. Vincent", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Sao Tome and Principe", replacement = "Sao Tome", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Solomon Islands", replacement = "Solomon Isl.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Sudan \\(former\\)", replacement = "Sudan", x = all_data2$Country)
all_data2$Country <- gsub(pattern = "Syrian Arab Republic", replacement = "Syria", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "United Arab Emirates", replacement = "United Arab Em.", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "United Republic of Tanzania", replacement = "Tanzania", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "United States of America", replacement = "USA", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Venezuela \\(Bolivarian Republic of\\)", replacement = "Venezuela", x = all_data2$Country)
all_data2$Country <- gsub(pattern = "Yugoslav SFR", replacement = "Yugoslavia", x = all_data2$Country, fixed = T)
all_data2$Country <- gsub(pattern = "Viet Nam", replacement = "Vietnam", x = all_data2$Country, fixed = T)
# grep(pattern = "Yugoslav SFR", x = all_data2$Country, value = T)

# create data sources
all_data3 <- all_data2 %>% group_by(Country, Element, Unit, food_group, Year) %>% summarise(sum(Value))
names(all_data3)[ncol(all_data3)] <- 'Value'

# change group name
all_data3$food_group <- tolower(gsub(pattern = ' ', replacement = '_', x = all_data3$food_group))
all_data3$Country <- as.character(all_data3$Country)
all_data3$Country <- gsub(pattern = ".", replacement = "", x = all_data3$Country, fixed = T)

# select only 6 countries
# all_data3 <- all_data3 %>% filter(Country %in% c('Colombia', 'India', 'Germany', 'France', 'Argentina', 'Japan'))

# ----------------------------------------------------------------------------------- #
# Food groups
# ----------------------------------------------------------------------------------- #

# create data sources for each metric
measures <- all_data3$Element %>% unique %>% as.character
measures <- c(measures[2], measures[4], measures[1], measures[3])
nicerNms <- c('calories', 'protein', 'fat', 'food_quantity')
lapply(1:length(measures), function(i){
  
  subData <- all_data3 %>% dplyr::filter(Element == measures[i])
  subData$Value <- round(subData$Value, 1)
  subData$Country <- tolower(subData$Country)
  subData$Country <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = subData$Country)
  subData$Country <- gsub(pattern = ' ', replacement = '-', x = subData$Country)
  subData$combination <- paste(subData$Country, '_', subData$food_group, sep = '')
  
  subData <- subData[c('Year', 'Value', 'combination')]
  subData <- subData %>% spread(key = combination, value = Value)
  colnames(subData)[1] <- 'year'
  subData <- as.data.frame(subData)
  colnames(subData)[ncol(subData)] <- paste(colnames(subData)[ncol(subData)], ',', sep = '')
  subData[,ncol(subData)] <- paste(subData[,ncol(subData)], ',', sep='')
  
  # write.delim(subData, paste(nicerNms[i], '.tsv', sep = ''))
  write.csv(subData, file = paste('./_data_sources/global/global2/', nicerNms[i], '.csv', sep = ''), row.names = FALSE, quote = FALSE, sep = "|")
  
})

# ----------------------------------------------------------------------------------- #
# Food items
# ----------------------------------------------------------------------------------- #

# create data sources
all_data3 <- all_data2

# change group name
all_data3$Item <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = all_data3$Item)
all_data3$Item <- tolower(gsub(pattern = ' ', replacement = '_', x = all_data3$Item))
all_data3$Item <- tolower(gsub(pattern = ',', replacement = '', x = all_data3$Item))
all_data3$Item <- gsub(pattern = '\\_$', replacement = '', x = all_data3$Item)
all_data3$Item <- gsub(pattern = '\\&', replacement = 'and', x = all_data3$Item)
all_data3$Country <- as.character(all_data3$Country)
all_data3$Country <- gsub(pattern = ".", replacement = "", x = all_data3$Country, fixed = T)

# create data sources for each metric
measures <- all_data3$Element %>% unique %>% as.character
measures <- c(measures[2], measures[4], measures[1], measures[3])
nicerNms <- c('calories', 'protein', 'fat', 'food_quantity')
lapply(1:length(measures), function(i){
  
  subData <- all_data3 %>% dplyr::filter(Element == measures[i])
  subData$Value <- round(subData$Value, 1)
  subData$Country <- tolower(subData$Country)
  subData$Country <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = subData$Country)
  subData$Country <- gsub(pattern = ' ', replacement = '-', x = subData$Country)
  subData$combination <- paste(subData$Country, '_', subData$Item, sep = '')
  
  subData <- subData[c('Year', 'Value', 'combination')]
  subData <- subData %>% spread(key = combination, value = Value)
  colnames(subData)[1] <- 'year'
  subData <- as.data.frame(subData)
  colnames(subData)[ncol(subData)] <- paste(colnames(subData)[ncol(subData)], ',', sep = '')
  subData[,ncol(subData)] <- paste(subData[,ncol(subData)], ',', sep='')
  
  # write.delim(subData, paste(nicerNms[i], '.tsv', sep = ''))
  write.csv(subData, file = paste('./_data_sources/crop/', nicerNms[i], '.csv', sep = ''), row.names = FALSE, quote = FALSE, sep = "|")
  
})

# ----------------------------------------------------------------------------------- #
# Food items & food group
# ----------------------------------------------------------------------------------- #

# create data sources
all_data3 <- all_data2 %>% group_by(Item, Element, Unit, food_group, Year) %>% summarise(mean(Value))
names(all_data3)[ncol(all_data3)] <- 'Value'

# change group name
all_data3$food_group <- tolower(gsub(pattern = ' ', replacement = '_', x = all_data3$food_group))
all_data3$Item <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = all_data3$Item)
all_data3$Item <- tolower(gsub(pattern = ' ', replacement = '-', x = all_data3$Item))
all_data3$Item <- tolower(gsub(pattern = ',', replacement = '', x = all_data3$Item))
all_data3$Item <- gsub(pattern = '\\-$', replacement = '', x = all_data3$Item)
all_data3$Item <- gsub(pattern = '\\&', replacement = 'and', x = all_data3$Item)

# create data sources for each metric
measures <- all_data3$Element %>% unique %>% as.character
measures <- c(measures[2], measures[4], measures[1], measures[3])
nicerNms <- c('calories', 'protein', 'fat', 'food_quantity')
lapply(1:length(measures), function(i){
  
  subData <- all_data3 %>% dplyr::filter(Element == measures[i])
  subData$Value <- round(subData$Value, 1)
  subData$combination <- paste(subData$food_group, '_', subData$Item, sep = '')
  
  subData <- subData[c('Year', 'Value', 'combination')]
  subData <- subData %>% spread(key = combination, value = Value)
  colnames(subData)[1] <- 'year'
  subData <- as.data.frame(subData)
  # colnames(subData)[ncol(subData)] <- paste(colnames(subData)[ncol(subData)], ',', sep = '')
  # subData[,ncol(subData)] <- paste(subData[,ncol(subData)], ',', sep='')
  
  # write.delim(subData, paste(nicerNms[i], '.tsv', sep = ''))
  write.csv(subData, file = paste('./_data_sources/global/', nicerNms[i], '.csv', sep = ''), row.names = FALSE, quote = FALSE, sep = "|")
  
})

# ----------------------------------------------------------------------------------- #
# Food items & food group per country
# ----------------------------------------------------------------------------------- #

# create data sources
all_data3 <- all_data2

# change group name
all_data3$food_group <- tolower(gsub(pattern = ' ', replacement = '-', x = all_data3$food_group))
all_data3$Item <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = all_data3$Item)
all_data3$Item <- tolower(gsub(pattern = ' ', replacement = '_', x = all_data3$Item))
all_data3$Item <- tolower(gsub(pattern = ',', replacement = '', x = all_data3$Item))
all_data3$Item <- gsub(pattern = '\\_$', replacement = '', x = all_data3$Item)
all_data3$Item <- gsub(pattern = '\\&', replacement = 'and', x = all_data3$Item)
all_data3$Country <- as.character(all_data3$Country)
all_data3$Country <- tolower(all_data3$Country)
all_data3$Country <- gsub(pattern = '* \\((.*?)\\)', replacement = '', x = all_data3$Country)
all_data3$Country <- gsub(pattern = ' ', replacement = '_', x = all_data3$Country)
all_data3$Country <- gsub(pattern = "\\'", replacement = '', x = all_data3$Country)

# create data sources for each country
countries <- all_data3$Country %>% unique %>% as.character %>% sort
measures  <- all_data3$Element %>% unique %>% as.character %>% sort
measures <- c(measures[2], measures[4], measures[1], measures[3])
nicerNms <- c('calories', 'protein', 'fat', 'food_quantity')

write.csv(data.frame(Country = countries), file = paste(getwd(), "/_data_sources/country_food_group_crop/countryList.csv", sep = ""), row.names = FALSE)

lapply(1:length(measures), function(i){
  
  elementData <- all_data3 %>% dplyr::filter(Element == measures[i])
  element_dir <- paste(getwd(), "/_data_sources/country_food_group_crop/", nicerNms[i], sep = "")
  if(!dir.exists(element_dir)){dir.create(path = element_dir, showWarnings = FALSE, recursive = TRUE)}
  
  lapply(1:length(countries), function(j){
    
    countryData <- elementData %>% dplyr::filter(Country == countries[j])
    countryData$Value <- round(countryData$Value, 1)
    countryData$combination <- paste(countryData$food_group, "_", countryData$Item, sep = "")
    
    countryData <- countryData[c("Year", "Value", "combination")]
    countryData <- countryData %>% spread(key = combination, value = Value)
    colnames(countryData)[1] <- "year"
    countryData <- as.data.frame(countryData)
    # colnames(countryData)[ncol(countryData)] <- paste(colnames(countryData)[ncol(countryData)], ",", sep = "")
    # countryData[,ncol(countryData)] <- paste(countryData[,ncol(countryData)], ",", sep = "")
    
    # write.delim(subData, paste(nicerNms[i], '.tsv', sep = ''))
    write.csv(countryData, file = paste(element_dir, "/", countries[j], ".csv", sep = ""), row.names = FALSE, sep = "|", quote = FALSE)
    
  })
  
})

# # create data sources for each metric
# measures <- all_data3$Element %>% unique %>% as.character
# nicerNms <- c('fat', 'calories', 'food_quantity', 'protein')
# lapply(1:length(measures), function(i){
#   
#   subData <- all_data3 %>% dplyr::filter(Element == measures[i])
#   subData$Value <- round(subData$Value, 1)
#   subData$combination <- paste(subData$food_group, '_', subData$Item, sep = '')
#   
#   subData <- subData[c('Year', 'Value', 'combination')]
#   subData <- subData %>% spread(key = combination, value = Value)
#   colnames(subData)[1] <- 'year'
#   subData <- as.data.frame(subData)
#   # colnames(subData)[ncol(subData)] <- paste(colnames(subData)[ncol(subData)], ',', sep = '')
#   # subData[,ncol(subData)] <- paste(subData[,ncol(subData)], ',', sep='')
#   
#   # write.delim(subData, paste(nicerNms[i], '.tsv', sep = ''))
#   write.csv(subData, file = paste('./_data_sources/global/global2/', nicerNms[i], '.csv', sep = ''), row.names = FALSE, quote = FALSE, sep = "|")
#   
# })


# -> functional programming

all_world <- all_data2 %>% group_by(Item, Element, Unit, food_group, Year) %>% summarise(sum(Value, na.rm = TRUE))
colnames(all_world)[ncol(all_world)] <- 'Value'
all_world$Item <- as.character(all_world$Item)
all_world$Element <- as.character(all_world$Element)
all_world$Unit <- as.character(all_world$Unit)
all_world$food_group <- as.character(all_world$food_group)
all_world$Value <- round(all_world$Value, 1)

all_world$gFood <- NA
# all_world$gFood[grep(pattern = 'Animal products', x = all_world$food_group, fixed = TRUE)] <- 'meat'
# all_world$gFood[grep(pattern = 'Fruits', x = all_world$food_group, fixed = TRUE)] <- 'fruits'
# all_world$gFood[grep(pattern = 'Cereals', x = all_world$food_group, fixed = TRUE)] <- 'cereals'
# all_world$gFood[grep(pattern = 'Pulses', x = all_world$food_group, fixed = TRUE)] <- 'pulses'
# all_world$gFood[grep(pattern = 'Alcoholic beverages', x = all_world$food_group, fixed = TRUE)] <- 'alcoholic'
# all_world$gFood[grep(pattern = 'Starchy roots', x = all_world$food_group, fixed = TRUE)] <- 'roots'
# all_world$gFood[grep(pattern = 'Spices', x = all_world$food_group, fixed = TRUE)] <- 'spices'
# all_world$gFood[grep(pattern = 'Stimulants', x = all_world$food_group, fixed = TRUE)] <- 'stimulants'
# all_world$gFood[grep(pattern = 'Oilcrops', x = all_world$food_group, fixed = TRUE)] <- 'oilcrops'
# all_world$gFood[grep(pattern = 'Miscellaneous', x = all_world$food_group, fixed = TRUE)] <- 'miscellaneous'
# all_world$gFood[grep(pattern = 'Vegetables', x = all_world$food_group, fixed = TRUE)] <- 'vegetables'
# all_world$gFood[grep(pattern = 'Sugarcrops', x = all_world$food_group, fixed = TRUE)] <- 'sugarcrops'

all_world$gFood[grep(pattern = 'Cereals', x = all_world$food_group, fixed = TRUE)] <- 'cereals'
all_world$gFood[grep(pattern = 'Animal products', x = all_world$food_group, fixed = TRUE)] <- 'animal'
all_world$gFood[grep(pattern = 'Starchy roots', x = all_world$food_group, fixed = TRUE)] <- 'roots'
all_world$gFood[grep(pattern = 'Oilcrops', x = all_world$food_group, fixed = TRUE)] <- 'oilcrops'
all_world$gFood[grep(pattern = 'Sugarcrops', x = all_world$food_group, fixed = TRUE)] <- 'sugarcrops'

all_world <- all_world[complete.cases(all_world),]; rownames(all_world) <- 1:nrow(all_world)

all_world$Columns <- paste(all_world$gFood, '_', gsub(pattern = ' ', replacement = '_', x = all_world$Item, fixed = TRUE), sep = '')
all_world$Columns <- gsub(pattern = ',', replacement = '', x = all_world$Columns, fixed = TRUE)

calories <- all_world %>% filter(Element == 'Food supply (kcal/capita/day)')
calories <- as.data.frame(calories)
calories <- calories %>% select(c(5,6,8))
calories <- calories %>% spread(key = Columns, value = Value)
colnames(calories)[1] <- 'year'

write.delim(calories, 'calories.tsv')

# functional programing <- 

all_data2 <- all_data2 %>% mutate(year1960 = Year - 1960)
all_data2 <- all_data2 %>%
  filter(Item == "Animal Products (Total)")

# nested data
by_country <- all_data2 %>%
  group_by(Element, Country) %>%
  nest()

# Fit models -----------------------------------------------------------------------------------

# create a function to estimate a linear regression model using variables: lifeExp and year1950 from each data frame nested
country_model <- function(df){
  lm(Value ~ year1960, data=df)
}

# run the linear model to each data frame nested and saving continent, country and linear model
models <- by_country %>%
  mutate(
    model = data %>% map(country_model)
  )
models

# Broom ---------------------------------------------------------------------------------------

models <- models %>%
  mutate(
    glance  = model %>% map(broom::glance),
    rsq     = glance %>% map_dbl("r.squared"),
    tidy    = model %>% map(broom::tidy),
    augment = model %>% map(broom::augment)
  )
models

models %>% arrange(desc(rsq))

models %>%
  ggplot(aes(rsq, reorder(Country, rsq))) +
  geom_point(aes(colour = Element)) + theme_dark()

# Unnest

models %>%
  unnest(tidy) %>%
  dplyr::select(Element, Country, term, estimate, rsq) %>%
  spread(term, estimate) %>%
  ggplot(aes(`(Intercept)`, year1960)) +
  geom_point(aes(colour = Element, size = rsq)) +
  geom_smooth(se = FALSE) +
  xlab("Animal products consumption") +
  ylab("Yearly improvement") +
  scale_size_area()

models %>%
  unnest(augment) %>%
  ggplot(aes(year1960, .resid)) +
  geom_line(aes(group = Country), alpha = 1/3) +
  geom_smooth(se = FALSE) +
  geom_hline(yintercept = 0, colour = "white") +
  facet_wrap(~Element)
