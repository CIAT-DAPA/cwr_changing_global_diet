# Changing global diet - Processing data
# H. Achicanoy
# CIAT, 2016

# change R options

options(scipen = 999); options(warn = -1)

# load packages

library(dplyr)
library(tidyr)
library(ggplot2)
library(caroline)

# load global diet data

all_data <- read.csv('all_1961_2009_final_analysis_data_completeready.csv')

# load food groups

gFood <- read.csv('FBS_commodities_foodgroups_regions_finaltest.csv')
gFood <- gFood %>% select(1:2) %>% unique

all_data2 <- left_join(all_data, gFood, by=c('Item'))
rm(all_data, gFood)

all_data2 <- all_data2 %>% tidyr::gather(Year, Value, Y1961:Y2009)
all_data2$Year <- as.numeric(gsub(pattern='Y', replacement='', x=all_data2$Year))

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
