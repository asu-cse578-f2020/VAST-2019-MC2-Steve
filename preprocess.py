from math import sin, cos, sqrt, atan2, radians 
import csv
 

#  Timestamp,Sensor-id,Long,Lat,Value,Units, User-id

SENSOR_ID = "Sensor-id"
LAT = "Lat"
LONG = "Long"
CO_ORDINATES = "Co-ordinates"
VALUE = "Value"
UNITS = "Units"
USER_ID = "User-id"
TIMESTAMP = "Timestamp"

SENSOR_ID_IDX = 1
LAT_IDX = 3
LONG_IDX = 2
VALUE_IDX = 4
UNITS_IDX = 5
USER_ID_IDX = 6
TIMESTAMP_IDX = 0

def getDistanceInKm(point1,point2):
     
    #print(point1, point2)
    # approximate radius of earth in km
    R = 6371
    lat1 = radians(float(point1[1]))
    lon1 = radians(float(point1[0]))
    lat2 = radians(float(point2[1]))
    lon2 = radians(float(point2[0]))

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance
    print("Result:", distance)
    print("Should be:", 278.546, "km")


def getProximityDataForOneMobileDataSensor(num):

    print("NUM", num)
    with open('data/MobileSensorReadingsAggregate.csv') as baseFile:
        base = csv.reader(baseFile, delimiter=',')

        baseidx=0
        mobileRowList = [["Timestamp","Sensor-id","Long","Lat","Value","Units", "User-id"]]
        baseListTemp = []
        baseList = []
        for baseRow in base:
            if(baseRow[SENSOR_ID_IDX]==num):
                baseListTemp.append(baseRow)
        print(len(baseListTemp))
        # baseList = filter(lambda x: x % 10 == 0, baseListTemp) 

        for i in range(len(baseListTemp)):
            if(i%10==0):
                baseList.append(baseListTemp[i])

        print(len(baseList))


        for baseRow in baseList:
            #print (type(baseRow))
            if(baseidx!=0):
                with open('data/MobileSensorReadingsAggregate.csv') as mobileFile:
                    mobile = csv.reader(mobileFile, delimiter=',')
                    mobileidx=0
                    for mobileRow in mobile:
                        # print(baseRow)
                        # print(mobileRow)
                        if(mobileidx!=0):
                            if(baseRow[SENSOR_ID_IDX] != mobileRow[SENSOR_ID_IDX] and getDistanceInKm([baseRow[LONG_IDX], baseRow[LAT_IDX]], [mobileRow[LONG_IDX], mobileRow[LAT_IDX]]) < 1):
                                #print(mobileRow)
                                mobileRowList.append(mobileRow)
                        mobileidx+=1
            baseidx+=1
        
        print(len(mobileRowList))

        with open("MobileProximityData_"+num+".csv", "w") as f:
            writer = csv.writer(f)
            writer.writerows(mobileRowList)

       
uniqueMobileSensorNumber = ["15", "22", "40", "1", "27", "30", "8", "41", "9", "37", "26", "16", "49", "13", "2", "31", "44", "6", "43", "14", "11", "23", "32", "3", "5", "35", "24", "4", "34", "45", "47", "39", "19", "29", "38", "12", "33", "17", "46", "10", "7", "18", "20", "50", "28", "48", "36", "25", "42", "21"]

# uniqueMobileSensorNumber = ["45", "47", "39", "19", "29", "38", "12", "33", "17", "46", "10", "7", "18", "20", "50", "28", "48", "36", "25", "42", "21"]

for uniq in uniqueMobileSensorNumber:
    getProximityDataForOneMobileDataSensor(uniq)
    #break